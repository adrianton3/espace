/*! espace by Adrian Toncean released under the MIT license */
function IterableString (string) {
    this.string = string;
    this.pointer = 0;
    this.marker = 0;

    this.line = 1;
    this.column = 1;
}

IterableString.prototype.advance = function () {
    if (this.current() === '\n') {
        this.line++;
        this.column = 1;
    } else {
        this.column++;
    }

    this.pointer++;
};

IterableString.prototype.setMarker = function (offset = 0) {
    this.marker = this.pointer + offset;
};

IterableString.prototype.current = function () {
    return this.string.charAt(this.pointer)
};

IterableString.prototype.next = function () {
    return this.string.charAt(this.pointer + 1)
};

IterableString.prototype.hasNext = function () {
    return this.pointer < this.string.length
};

IterableString.prototype.getMarked = function (offset = 0) {
    return this.string.substring(this.marker, this.pointer + offset)
};

IterableString.prototype.getCoords = function () {
    return {
        line: this.line,
        column: this.column,
    }
};

function raise$1 (coords, message) {
    const exception = new Error(message);
    exception.coords = coords;
    throw exception
}

function tokenize (string, options = {}) {
    const whitespace = !!options.whitespace;
    const comments = !!options.comments;
    const coords = !!options.coords;
    const prefixes = options.prefixes || {};

    const makeToken = coords ?
        (type, value, coords) => ({ type, value, coords }) :
        (type, value) => ({ type, value });

    const escape = {
        '\\': '\\',
        'n': '\n',
        't': '\t',
        '"': '"',
    };

    function chopString (str) {
        const accumulated = [];
        str.advance();

        while (true) {
            if (str.current() === '\\') {
                str.advance();
                if (escape[str.current()]) {
                    accumulated.push(escape[str.current()]);
                }
            } else if (str.current() === '"') {
                str.advance();
                return makeToken('string', accumulated.join(''), str.getCoords())
            } else if (str.current() === '\n' || !str.hasNext()) {
                raise$1(str.getCoords(), 'String not properly ended');
            } else {
                accumulated.push(str.current());
            }

            str.advance();
        }
    }

    function chopNumber (str) {
        str.setMarker();

        let tmp = str.current();
        while (tmp >= '0' && tmp <= '9') {
            str.advance();
            tmp = str.current();
        }

        if (str.current() === '.') {
            str.advance();
            let tmp = str.current();
            while (tmp >= '0' && tmp <= '9') {
                str.advance();
                tmp = str.current();
            }
        }

        if (!')]} \n\t'.includes(str.current())) {
            raise$1(
                str.getCoords(),
                `Unexpected character '${str.current()}' after '${str.getMarked()}'`,
            );
        }

        return makeToken('number', Number(str.getMarked()), str.getCoords())
    }

    function chopCommentMulti (str) {
        str.setMarker(2);
        str.advance();
        str.advance();

        while (true) {
            if (str.current() === '-' && str.next() === ';') {
                str.advance();
                str.advance();
                return makeToken('comment', str.getMarked(-2), str.getCoords())
            } else if (str.hasNext()) {
                str.advance();
            } else {
                raise$1(str.getCoords(), 'Multiline comment not properly terminated');
            }
        }
    }

    function chopCommentSingle (str) {
        str.setMarker(1);
        str.advance();

        while (true) {
            if (str.current() === '\n' || !str.hasNext()) {
                str.advance();
                return makeToken('comment', str.getMarked(), str.getCoords())
            } else {
                str.advance();
            }
        }
    }

    function chopIdentifier (str) {
        str.setMarker();

        let tmp = str.current();
        while (
            tmp > ' ' && tmp <= '~' &&
            tmp !== '(' && tmp !== ')' &&
            tmp !== '[' && tmp !== ']' &&
            tmp !== '{' && tmp !== '}'
        ) {
            str.advance();
            tmp = str.current();
        }

        return makeToken('identifier', str.getMarked(), str.getCoords())
    }

    function chopWhitespace (str) {
        const tmp = str.current();
        str.advance();
        return makeToken('whitespace', tmp, str.getCoords())
    }

    return (() => {
        const str = new IterableString(string);
        const tokens = [];

        while (str.hasNext()) {
            const current = str.current();

            // TODO: use a table instead
            if (current === '"') {
                tokens.push(chopString(str));
            } else if (current === ';') {
                if (str.next() === '-') {
                    const tmp = chopCommentMulti(str);

                    if (comments) {
                        tokens.push(tmp);
                    }
                } else {
                    const tmp = chopCommentSingle(str);

                    if (comments) {
                        tokens.push(tmp);
                    }
                }
            } else if (current >= '0' && current <= '9') {
                tokens.push(chopNumber(str));
            } else if (current === '(' || current === '[' || current === '{') {
                tokens.push(makeToken('open', current, str.getCoords()));
                str.advance();
            } else if (current === ')' || current === ']' || current === '}') {
                tokens.push(makeToken('closed', current, str.getCoords()));
                str.advance();
            } else if (prefixes.hasOwnProperty(current)) {
                tokens.push(makeToken('prefix', prefixes[current], str.getCoords()));
                str.advance();
            } else if (current > ' ' && current <= '~') {
                tokens.push(chopIdentifier(str));
            } else {
                const tmp = chopWhitespace(str);
                if (whitespace) {
                    tokens.push(tmp);
                }
            }
        }

        // tokens.push(tokenV('END', str.getCoords()));

        return tokens
    })()
}

function raise (token, message) {
    const exception = new Error(message);
    exception.coords = token.coords;
    throw exception
}

function makeList (token) {
    return {
        type: 'list',
        token,
        children: [],
    }
}

function makeListPrefix (token, child) {
    return {
        type: 'list',
        token,
        children: [{
            type: 'atom',
            token: {
                type: 'identifier',
                value: token.value,
            },
        }, child],
    }
}

function getMatching (open) {
    return open === '(' ? ')'
        : open === '[' ? ']'
        : '}'
}

function parse (tokens) {
    let index = 0;

    function traverse () {
        const token = tokens[index];
        index++;

        if (token.type === 'open') {
            const list = makeList(token);
            const expectedMatching = getMatching(token.value);

            while (true) {
                if (index >= tokens.length) {
                    raise(tokens[index - 1], `Expected matching '${expectedMatching}' before end of input`);
                }

                if (tokens[index].type === 'closed') {
                    if (tokens[index].value === expectedMatching) {
                        index++;
                        break
                    } else {
                        raise(tokens[index], `Expected matching '${getMatching(token.value)}'`);
                    }
                }

                list.children.push(traverse());
            }

            return list
        }

        if (token.type === 'prefix') {
            if (index >= tokens.length) {
                raise(tokens[index - 1], `Unexpected end of input`);
            }

            return makeListPrefix(token, traverse())
        }

        return {
            type: 'atom',
            token,
        }
    }

    const top = [];

    while (index < tokens.length) {
        const token = tokens[index];

        if (token.type === 'closed') {
            raise(token, `Unexpected '${token.value}'`);
        }

        top.push(traverse());
    }

    return top
}

function serialize (expression) {
    if (expression instanceof Array) {
        return expression.map(serialize).join(' ')
    }

    if (expression.type === 'list') {
        if (expression.token.type === 'prefix') {
            return `${expression.token.value}${serialize(expression.children[0])}`
        } else {
            const childrenString = expression.children.map(serialize).join(' ');

            return expression.token.value === '(' ? `(${childrenString})`
                : expression.token.value === '[' ? `[${childrenString}]`
                : `{${childrenString}}`
        }
    }

    switch (expression.token.type) {
        case 'string':
            return `"${expression.token.value}"`
        case 'number':
            return String(expression.token.value)
        case 'identifier':
            return expression.token.value
    }
}

function extract (source, pattern) {
    const map = {};

    function extract (source, pattern) {
        if (pattern.type === 'list') {
            if (source.type !== 'list' || source.token.value !== pattern.token.value) {
                return false
            }

            // just a precheck before we dive in
            if (pattern.rest) {
                if (source.children.length < pattern.rest.before + 1 + pattern.rest.after) {
                    return false
                }
            } else {
                if (source.children.length !== pattern.children.length) {
                    return false
                }
            }

            // first symbol must be the same identifier in both cases
            if (
                source.children[0].token.type !== 'identifier' ||
                source.children[0].token.value !== pattern.children[0].token.value
            ) {
                return false
            }

            // the rest have to match
            if (pattern.rest) {
                for (let i = 1; i <= pattern.rest.before; i++) {
                    if (!extract(source.children[i], pattern.children[i])) {
                        return false
                    }
                }

                map[pattern.rest.name] = source.children.slice(
                    1 + pattern.rest.before,
                    source.children.length - pattern.rest.after
                );

                for (let i = 0; i < pattern.rest.after; i++) {
                    if (!extract(
                        source.children[source.children.length - pattern.rest.after + i],
                        pattern.children[i + 1 + 1 + pattern.rest.before])
                    ) {
                        return false
                    }
                }
            } else {
                for (let i = 1; i < pattern.children.length; i++) {
                    if (!extract(source.children[i], pattern.children[i])) {
                        return false
                    }
                }
            }

            return true
        } else {
            map[pattern.token.value] = source;

            return true
        }
    }

    return extract(source, pattern) ? map : null
}


function deepClone (tree) {
    const treeClone = {
        type: tree.type,
        token: {
            type: tree.token.type,
            value: tree.token.value,
        },
    };

    if (tree.type === 'list') {
        treeClone.children = tree.children.map(deepClone);
    }

    return treeClone
}


function isPrefixed (string) {
    return string.length > 1 && string[0] === '_'
}

function inject (tree, map, suffixes) {
    const suffixesThisRound = {};

    function inject (tree) {
        if (tree.children.length > 0) {
            const child = tree.children[0];

            if (isPrefixed(child.token.value)) {
                if (!suffixesThisRound[child.token.value]) {
                    if (typeof suffixes[child.token.value] !== 'undefined') {
                        suffixes[child.token.value]++;
                    } else {
                        suffixes[child.token.value] = 0;
                    }

                    suffixesThisRound[child.token.value] = `${child.token.value}_${suffixes[child.token.value]}`;
                }

                child.token.value = suffixesThisRound[child.token.value];
            }
        }

        for (let i = 1; i < tree.children.length; i++) {
            const child = tree.children[i];

            if (child.token.type === 'identifier') {
                const replaceTree = map[child.token.value];
                if (Array.isArray(replaceTree)) {
                    tree.children.splice(i, 1, ...replaceTree);
                    i += replaceTree.length - 1;
                } else if (replaceTree) {
                    tree.children[i] = replaceTree;
                } else if (isPrefixed(child.token.value)) {
                    if (!suffixesThisRound[child.token.value]) {
                        if (typeof suffixes[child.token.value] !== 'undefined') {
                            suffixes[child.token.value]++;
                        } else {
                            suffixes[child.token.value] = 0;
                        }

                        suffixesThisRound[child.token.value] = child.token.value + '_' + suffixes[child.token.value];
                    }

                    child.token.value = suffixesThisRound[child.token.value];
                }
            } else if (child.type === 'list') {
                inject(child);
            }
        }
    }

    if (tree.token.type === 'identifier') {
        const replaceTree = map[tree.token.value];
        if (replaceTree) {
            tree.token = replaceTree.token;
            if (replaceTree.type === 'list') {
                tree.children = replaceTree.children;
            }
        }
    } else if (tree.type === 'list') {
        inject(tree);
    }
}


function isRest (string) {
    return string.length > 3 && string.slice(-3) === '...'
}

function processForRest (tree) {
    function traverse (tree) {
        if (tree.type !== 'list') { return }

        for (let i = 1; i < tree.children.length; i++) {
            const { token } = tree.children[i];

            if (token.type === 'identifier' && isRest(token.value)) {
                tree.rest = {
                    before: i - 1,
                    after: tree.children.length - i - 1,
                    name: token.value,
                };
            } else {
                traverse(tree.children[i]);
            }
        }
    }

    traverse(tree);
}


function validateRule (pattern, substitute) {
    const vars = new Set;
    const rests = new Set;

    function traversePattern (tree) {
        if (tree.children.length > 0 && tree.children[0].token.type !== 'identifier') {
            throw new Error(`Tokens of type ${tree.children[0].token.type} are not allowed in patterns`)
        }

        let rest = false;
        for (let i = 1; i < tree.children.length; i++) {
            const subTree = tree.children[i];

            if (subTree.token.type === 'identifier') {
                if (isPrefixed(subTree.token.value)) {
                    throw new Error('Pattern can not contain variables prefixed by \'_\'')
                }

                if (vars.has(subTree.token.value)) {
                    throw new Error(`Variable "${subTree.token.value}" already used in pattern`)
                } else {
                    vars.add(subTree.token.value);
                }

                if (isRest(subTree.token.value)) {
                    if (rest) {
                        throw new Error('Pattern can contain at most one rest variable on a level')
                    }
                    rest = true;
                    rests.add(subTree.token.value);
                }
            } else if (subTree.type === 'list') {
                traversePattern(subTree);
            } else {
                throw new Error(`Tokens of type ${subTree.token.type} are not allowed in patterns`)
            }
        }
    }

    function traverseSubstitute (tree) {
        if (tree.type === 'atom') {
            if (
                tree.token.type === 'identifier' &&
                isRest(tree.token.value) &&
                !rests.has(tree.token.value)
            ) {
                throw new Error(`Rest variable '${tree.token.value}' is not present in pattern`)
            }

            return
        }

        for (let i = 0; i < tree.children.length; i++) {
            traverseSubstitute(tree.children[i]);
        }
    }

    if (pattern.type === 'list') {
        traversePattern(pattern);
    } else {
        throw new Error('Pattern can not be an atom')
    }

    traverseSubstitute(substitute);
}


function expand (source, pattern, substitute, suffixes = {}) {
    processForRest(pattern);

    function traverse (source) {
        const map = extract(source, pattern);

        if (map) {
            const newSubtree = deepClone(substitute);
            inject(newSubtree, map, suffixes);

            // putting it back together
            source.token = newSubtree.token;
            source.children = newSubtree.children;
        }

        if (source.type === 'list') {
            source.children.forEach(traverse);
        }
    }

    traverse(source);
}

export { expand, parse, serialize, tokenize, validateRule };
