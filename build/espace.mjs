/*! espace by Adrian Toncean released under the MIT license */
function IterableString (string) {
    this.string = string;
    this.pointer = 0;
    this.marker = 0;

    this.line = 1;
    this.column = 1;
}

IterableString.prototype.advance = function () {
    if (this.getCurrent() === '\n') {
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

IterableString.prototype.hasCurrent = function () {
    return this.pointer < this.string.length
};

IterableString.prototype.getCurrent = function () {
    return this.string.charAt(this.pointer)
};

IterableString.prototype.hasNext = function () {
    return this.pointer < this.string.length - 1
};

IterableString.prototype.getNext = function () {
    return this.string.charAt(this.pointer + 1)
};

IterableString.prototype.hasNextNext = function () {
    return this.pointer < this.string.length - 2
};

IterableString.prototype.getNextNext = function () {
    return this.string.charAt(this.pointer + 2)
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

function tokenize (string, optionsMaybe) {
    const coords = optionsMaybe?.coords === true;

    const prefixes = optionsMaybe?.prefixes != null ?
        new Map(Object.entries(optionsMaybe.prefixes)) :
        new Map;

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
        const chars = [];
        str.advance();

        while (true) {
            if (str.getCurrent() === '\\') {
                str.advance();
                if (escape[str.getCurrent()]) {
                    chars.push(escape[str.getCurrent()]);
                }
            } else if (str.getCurrent() === '"') {
                str.advance();
                return makeToken('string', chars.join(''), str.getCoords())
            } else if (str.getCurrent() === '\n' || !str.hasNext()) {
                raise$1(str.getCoords(), 'String not terminated');
            } else {
                chars.push(str.getCurrent());
            }

            str.advance();
        }
    }

    function isDigitBin (char) {
        return char === '0' || char === '1'
    }

    function isDigitDec (char) {
        return char >= '0' && char <= '9'
    }

    function isDigitHex (char) {
        return isDigitDec(char) || (char >= 'A' && char <= 'F') || (char >= 'a' && char <= 'f')
    }

    function chopNumber (str) {
        str.setMarker();

        let minus = false;
        if (str.getCurrent() === '-') {
            str.advance();
            minus = true;
        }

        if (str.getCurrent() === '0' && str.getNext() === 'b') {
            str.advance();
            str.advance();

            if (!str.hasCurrent()) {
                raise$1(str.getCoords(), 'Number not terminated');
            }

            const current = str.getCurrent();
            if (!isDigitBin(current)) {
                raise$1(str.getCoords(), `Unexpected character '${str.getCurrent()}'`);
            }

            str.setMarker();
            str.advance();

            while (true) {
                if (!str.hasCurrent()) {
                    const value = parseInt(str.getMarked(), 2);
                    return makeToken('number', value === 0 ? 0 : minus ? -value : value , str.getCoords())
                }

                const current = str.getCurrent();
                if (current !== '0' && current !== '1') {
                    if (!')]} \n\t;'.includes(current)) {
                        raise$1(str.getCoords(), `Unexpected character '${str.getCurrent()}'`);
                    }
                    const value = parseInt(str.getMarked(), 2);
                    return makeToken('number', value === 0 ? 0 : minus ? -value : value , str.getCoords())
                }

                str.advance();
            }
        } else if (str.getCurrent() === '0' && str.getNext() === 'x') {
            str.advance();
            str.advance();

            if (!str.hasCurrent()) {
                raise$1(str.getCoords(), 'Number not terminated');
            }

            const current = str.getCurrent();
            if (!isDigitHex(current)) {
                raise$1(str.getCoords(), `Unexpected character '${str.getCurrent()}'`);
            }

            str.setMarker();
            str.advance();

            while (true) {
                if (!str.hasCurrent()) {
                    const value = parseInt(str.getMarked(), 16);
                    return makeToken('number', value === 0 ? 0 : minus ? -value : value , str.getCoords())
                }

                const current = str.getCurrent();
                if (!isDigitHex(current)) {
                    if (!')]} \n\t;'.includes(current)) {
                        raise$1(str.getCoords(), `Unexpected character '${str.getCurrent()}'`);
                    }
                    const value = parseInt(str.getMarked(), 16);
                    return makeToken('number', value === 0 ? 0 : minus ? -value : value , str.getCoords())
                }

                str.advance();
            }
        } else {
            let tmp = str.getCurrent();
            while (isDigitDec(tmp)) {
                str.advance();
                tmp = str.getCurrent();
            }

            if (str.getCurrent() === '.') {
                str.advance();
                let tmp = str.getCurrent();
                while (isDigitDec(tmp)) {
                    str.advance();
                    tmp = str.getCurrent();
                }
            }
        }

        if (!')]} \n\t;'.includes(str.getCurrent())) {
            raise$1(str.getCoords(), `Unexpected character '${str.getCurrent()}'`);
        }

        return makeToken('number', Number(str.getMarked()), str.getCoords())
    }

    function chopCommentMulti (str) {
        str.advance();
        str.advance();

        while (str.hasCurrent()) {
            if (str.getCurrent() === '-') {
                if (!str.hasNext()) {
                    raise$1(str.getCoords(), 'Multiline comment not terminated');
                }

                if (str.getNext() === ';') {
                    str.advance();
                    str.advance();
                    return
                }
            }

            str.advance();
        }

        raise$1(str.getCoords(), 'Multiline comment not terminated');
    }

    function chopCommentSingle (str) {
        str.advance();

        while (str.hasCurrent()) {
            if (str.getCurrent() === '\n') {
                str.advance();
                return
            } else {
                str.advance();
            }
        }
    }

    function chopIdentifier (str) {
        str.setMarker();

        while (true) {
            if (!str.hasCurrent()) {
                return makeToken('identifier', str.getMarked(), str.getCoords())
            }

            const current = str.getCurrent();

            if (
                current <= ' ' || current > '~' ||
                current === '(' || current === ')' ||
                current === '[' || current === ']' ||
                current === '{' || current === '}' ||
                current === ';'
            ) {
                return makeToken('identifier', str.getMarked(), str.getCoords())
            }

            str.advance();
        }
    }

    return (() => {
        const str = new IterableString(string);
        const tokens = [];

        while (str.hasCurrent()) {
            const current = str.getCurrent();

            if (current === '"') {
                tokens.push(chopString(str));
                continue
            }

            if (current === ';') {
                if (str.getNext() === '-') {
                    chopCommentMulti(str);
                } else {
                    chopCommentSingle(str);
                }
                continue
            }

            if (current === '(' || current === '[' || current === '{') {
                tokens.push(makeToken('open', current, str.getCoords()));
                str.advance();
                continue
            }

            if (current === ')' || current === ']' || current === '}') {
                tokens.push(makeToken('closed', current, str.getCoords()));
                str.advance();
                continue
            }

            if (current === '-') {
                if (!str.hasNext()) {
                    tokens.push(makeToken('identifier', '-', str.getCoords()));
                    return tokens
                }

                const next = str.getNext();

                if (isDigitDec(next)) {
                    tokens.push(chopNumber(str));
                    continue
                }

                if (next === '.') {
                    if (!str.hasNextNext()) {
                        tokens.push(makeToken('identifier', '-.', str.getCoords()));
                        return tokens
                    }

                    const nextNext = str.getNextNext();

                    if (isDigitDec(nextNext)) {
                        tokens.push(chopNumber(str));
                        continue
                    }
                }

                tokens.push(chopIdentifier(str));
                continue
            }

            if (current === '.') {
                if (!str.hasNext()) {
                    tokens.push(makeToken('identifier', '.', str.getCoords()));
                    return tokens
                }

                const next = str.getNext();

                if (isDigitDec(next)) {
                    tokens.push(chopNumber(str));
                    continue
                }

                tokens.push(chopIdentifier(str));
                continue
            }

            if (isDigitDec(current)) {
                tokens.push(chopNumber(str));
                continue
            }

            if (prefixes.has(current)) {
                tokens.push(makeToken('prefix', prefixes.get(current), str.getCoords()));
                str.advance();
                continue
            }

            if (current > ' ' && current <= '~') {
                tokens.push(chopIdentifier(str));
                continue
            }

            str.advance();
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
        return expression.map(serialize).join('\n\n')
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

                if (isRest(subTree.token.value)) {
                    const restless = subTree.token.value.slice(0, -3);
                    if (vars.has(restless)) {
                        throw new Error(`Variable '${restless}' already used in pattern`)
                    } else {
                        vars.add(restless);
                    }

                    if (rest) {
                        throw new Error('Pattern can contain at most one rest variable on a level')
                    }
                    rest = true;
                    rests.add(subTree.token.value);
                } else {
                    if (vars.has(subTree.token.value)) {
                        throw new Error(`Variable '${subTree.token.value}' already used in pattern`)
                    } else {
                        vars.add(subTree.token.value);
                    }
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
