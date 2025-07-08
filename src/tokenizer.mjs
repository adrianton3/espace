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
        str.setMarker()

        let minus = false
        if (str.getCurrent() === '-') {
            str.advance()
            minus = true
        }

        if (str.getCurrent() === '0' && str.getNext() === 'b') {
            str.advance()
            str.advance()

            if (!str.hasCurrent()) {
                raise(str.getCoords(), 'Number not terminated')
            }

            const current = str.getCurrent()
            if (!isDigitBin(current)) {
                raise(str.getCoords(), `Unexpected character '${str.getCurrent()}'`)
            }

            str.setMarker()
            str.advance()

            while (true) {
                if (!str.hasCurrent()) {
                    const value = parseInt(str.getMarked(), 2)
                    return makeToken('number', value === 0 ? 0 : minus ? -value : value , str.getCoords())
                }

                const current = str.getCurrent()
                if (current !== '0' && current !== '1') {
                    if (!')]} \n\t;'.includes(current)) {
                        raise(str.getCoords(), `Unexpected character '${str.getCurrent()}'`)
                    }
                    const value = parseInt(str.getMarked(), 2)
                    return makeToken('number', value === 0 ? 0 : minus ? -value : value , str.getCoords())
                }

                str.advance()
            }
        } else if (str.getCurrent() === '0' && str.getNext() === 'x') {
            str.advance()
            str.advance()

            if (!str.hasCurrent()) {
                raise(str.getCoords(), 'Number not terminated')
            }

            const current = str.getCurrent()
            if (!isDigitHex(current)) {
                raise(str.getCoords(), `Unexpected character '${str.getCurrent()}'`)
            }

            str.setMarker()
            str.advance()

            while (true) {
                if (!str.hasCurrent()) {
                    const value = parseInt(str.getMarked(), 16)
                    return makeToken('number', value === 0 ? 0 : minus ? -value : value , str.getCoords())
                }

                const current = str.getCurrent()
                if (!isDigitHex(current)) {
                    if (!')]} \n\t;'.includes(current)) {
                        raise(str.getCoords(), `Unexpected character '${str.getCurrent()}'`)
                    }
                    const value = parseInt(str.getMarked(), 16)
                    return makeToken('number', value === 0 ? 0 : minus ? -value : value , str.getCoords())
                }

                str.advance()
            }
        } else {
            let tmp = str.getCurrent()
            while (isDigitDec(tmp)) {
                str.advance()
                tmp = str.getCurrent()
            }

            if (str.getCurrent() === '.') {
                str.advance()
                let tmp = str.getCurrent()
                while (isDigitDec(tmp)) {
                    str.advance()
                    tmp = str.getCurrent()
                }
            }
        }

        if (!')]} \n\t;'.includes(str.getCurrent())) {
            raise(str.getCoords(), `Unexpected character '${str.getCurrent()}'`)
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

                if (isDigitDec(next)) {
                    tokens.push(chopNumber(str))
                    continue
                }

                if (next === '.') {
                    if (!str.hasNextNext()) {
                        tokens.push(makeToken('identifier', '-.', str.getCoords()))
                        return tokens
                    }

                    const nextNext = str.getNextNext()

                    if (isDigitDec(nextNext)) {
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

                if (isDigitDec(next)) {
                    tokens.push(chopNumber(str))
                    continue
                }

                tokens.push(chopIdentifier(str))
                continue
            }

            if (isDigitDec(current)) {
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
