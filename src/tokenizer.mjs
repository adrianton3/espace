import { IterableString } from './iterable-string.mjs'


function raise (coords, message) {
    const exception = new Error(message)
    exception.coords = coords
    throw exception
}

function tokenize (string, optionsMaybe) {
    const coords = optionsMaybe?.coords === true

    const prefixes = optionsMaybe?.prefixes != null ?
        new Map(Object.entries(optionsMaybe.prefixes)) :
        new Map

    const makeToken = coords ?
        (type, value, coords) => ({ type, value, coords }) :
        (type, value) => ({ type, value })

    const escape = {
        '\\': '\\',
        'n': '\n',
        't': '\t',
        '"': '"',
    }

    function chopString (str) {
        const chars = []
        str.advance()

        while (true) {
            if (str.getCurrent() === '\\') {
                str.advance()
                if (escape[str.getCurrent()]) {
                    chars.push(escape[str.getCurrent()])
                }
            } else if (str.getCurrent() === '"') {
                str.advance()
                return makeToken('string', chars.join(''), str.getCoords())
            } else if (str.getCurrent() === '\n' || !str.hasNext()) {
                raise(str.getCoords(), 'String not terminated')
            } else {
                chars.push(str.getCurrent())
            }

            str.advance()
        }
    }

    function chopNumber (str) {
        str.setMarker()

        if (str.getCurrent() === '-') {
            str.advance()
        }

        let tmp = str.getCurrent()
        while (tmp >= '0' && tmp <= '9') {
            str.advance()
            tmp = str.getCurrent()
        }

        if (str.getCurrent() === '.') {
            str.advance()
            let tmp = str.getCurrent()
            while (tmp >= '0' && tmp <= '9') {
                str.advance()
                tmp = str.getCurrent()
            }
        }

        if (!')]} \n\t;'.includes(str.getCurrent())) {
            raise(
                str.getCoords(),
                `Unexpected character '${str.getCurrent()}' after '${str.getMarked()}'`,
            )
        }

        return makeToken('number', Number(str.getMarked()), str.getCoords())
    }

    function chopCommentMulti (str) {
        str.advance()
        str.advance()

        while (str.hasCurrent()) {
            if (str.getCurrent() === '-') {
                if (!str.hasNext()) {
                    raise(str.getCoords(), 'Multiline comment not terminated')
                }

                if (str.getNext() === ';') {
                    str.advance()
                    str.advance()
                    return
                }
            }

            str.advance()
        }

        raise(str.getCoords(), 'Multiline comment not terminated')
    }

    function chopCommentSingle (str) {
        str.advance()

        while (str.hasCurrent()) {
            if (str.getCurrent() === '\n') {
                str.advance()
                return
            } else {
                str.advance()
            }
        }
    }

    function chopIdentifier (str) {
        str.setMarker()

        while (true) {
            if (!str.hasCurrent()) {
                return makeToken('identifier', str.getMarked(), str.getCoords())
            }

            const current = str.getCurrent()

            if (
                current <= ' ' || current > '~' ||
                current === '(' || current === ')' ||
                current === '[' || current === ']' ||
                current === '{' || current === '}' ||
                current === ';'
            ) {
                return makeToken('identifier', str.getMarked(), str.getCoords())
            }

            str.advance()
        }
    }

    return (() => {
        const str = new IterableString(string)
        const tokens = []

        while (str.hasCurrent()) {
            const current = str.getCurrent()

            if (current === '"') {
                tokens.push(chopString(str))
                continue
            }

            if (current === ';') {
                if (str.getNext() === '-') {
                    chopCommentMulti(str)
                } else {
                    chopCommentSingle(str)
                }
                continue
            }

            if (current === '(' || current === '[' || current === '{') {
                tokens.push(makeToken('open', current, str.getCoords()))
                str.advance()
                continue
            }

            if (current === ')' || current === ']' || current === '}') {
                tokens.push(makeToken('closed', current, str.getCoords()))
                str.advance()
                continue
            }

            if (current === '-') {
                if (!str.hasNext()) {
                    tokens.push(makeToken('identifier', '-', str.getCoords()))
                    return tokens
                }

                const next = str.getNext()

                if (next >= '0' && next <= '9') {
                    tokens.push(chopNumber(str))
                    continue
                }

                if (next === '.') {
                    if (!str.hasNextNext()) {
                        tokens.push(makeToken('identifier', '-.', str.getCoords()))
                        return tokens
                    }

                    const nextNext = str.getNextNext()

                    if (nextNext >= '0' && nextNext <= '9') {
                        tokens.push(chopNumber(str))
                        continue
                    }
                }

                tokens.push(chopIdentifier(str))
                continue
            }

            if (current === '.') {
                if (!str.hasNext()) {
                    tokens.push(makeToken('identifier', '.', str.getCoords()))
                    return tokens
                }

                const next = str.getNext()

                if (next >= '0' && next <= '9') {
                    tokens.push(chopNumber(str))
                    continue
                }

                tokens.push(chopIdentifier(str))
                continue
            }

            if (current >= '0' && current <= '9') {
                tokens.push(chopNumber(str))
                continue
            }

            if (prefixes.has(current)) {
                tokens.push(makeToken('prefix', prefixes.get(current), str.getCoords()))
                str.advance()
                continue
            }

            if (current > ' ' && current <= '~') {
                tokens.push(chopIdentifier(str))
                continue
            }

            str.advance()
        }

        // tokens.push(tokenV('END', str.getCoords()));

        return tokens
    })()
}


export {
    tokenize,
}
