import * as T from '../../../src/tokenizer.mjs'


describe('tokenizer', () => {
    const makeToken = (type) => (value) => ({ type, value })

    const makeNumber = makeToken('number')
    const makeString = makeToken('string')
    const makeIdentifier = makeToken('identifier')
    const makePrefix = makeToken('prefix')
    const makeOpen = makeToken('open')
    const makeClosed = makeToken('closed')

    const tokenize = (string) => T.tokenize(string, {
        prefixes: {
            '#': '#',
            '@': '@',
        },
    })

    it('tokenizes an empty string', () => {
        expect(tokenize('')).toEqual([])
    })

    describe('numbers', () => {
        it('tokenizes a number', () => {
            expect(tokenize('0')).toEqual([makeNumber(0)])
            expect(tokenize('5 ')).toEqual([makeNumber(5)])
            expect(tokenize('6\n\n')).toEqual([makeNumber(6)])
            expect(tokenize('1234')).toEqual([makeNumber(1234)])
        })

        it('tokenizes a floating point number', () => {
            expect(tokenize('0.1')).toEqual([makeNumber(0.1)])
            expect(tokenize('.1')).toEqual([makeNumber(0.1)])
            expect(tokenize('2.')).toEqual([makeNumber(2)])
            expect(tokenize('12.34')).toEqual([makeNumber(12.34)])
        })

        it('tokenizes a negative number', () => {
            expect(tokenize('-1')).toEqual([makeNumber(-1)])
            expect(tokenize('-1234')).toEqual([makeNumber(-1234)])
        })

        it('tokenizes a negative floating point number', () => {
            expect(tokenize('-0.1')).toEqual([makeNumber(-0.1)])
            expect(tokenize('-12.34')).toEqual([makeNumber(-12.34)])
            expect(tokenize('-.2')).toEqual([makeNumber(-0.2)])
        })

        it('tokenizes a number until a comment', () => {
            expect(tokenize('1;23')).toEqual([makeNumber(1)])
            expect(tokenize('-123;456')).toEqual([makeNumber(-123)])
            expect(tokenize('.2;3')).toEqual([makeNumber(0.2)])
            expect(tokenize('2.;3')).toEqual([makeNumber(2)])
        })

        it('tokenizes a number until a paren', () => {
            expect(tokenize('1)23')).toEqual([makeNumber(1), makeClosed(')'), makeNumber(23)])
        })

        it('throws an exception when given a number followed by non-separators', () => {
            expect(tokenize.bind(null, '123A')).toThrow(new Error("Unexpected character 'A' after '123'"))
            // half pi
            expect(tokenize.bind(null, '3.14.5')).toThrow(new Error("Unexpected character '.' after '3.14'"))
        })
    })

    describe('whitespace', () => {
        it('ignores whitespace', () => {
            expect(tokenize(' ')).toEqual([])
            expect(tokenize('\n')).toEqual([])
            expect(tokenize('\t')).toEqual([])
            expect(tokenize('  \n\t  ')).toEqual([])
            expect(tokenize('\n  \n1234\t ')).toEqual([makeNumber(1234)])
        })
    })

    describe('identifiers', () => {
        it('tokenizes an identifier', () => {
            expect(tokenize('a1234')).toEqual([makeIdentifier('a1234')])
        })

        it('tokenizes "-" as an identifier', () => {
            expect(tokenize('-')).toEqual([makeIdentifier('-')])
        })

        it('tokenizes "--" as an identifier', () => {
            expect(tokenize('--')).toEqual([makeIdentifier('--')])
        })

        it('tokenizes "." as an identifier', () => {
            expect(tokenize('.')).toEqual([makeIdentifier('.')])
        })

        it('tokenizes "-." as an identifier', () => {
            expect(tokenize('-.')).toEqual([makeIdentifier('-.')])
        })

        it('tokenizes "-.a" as an identifier', () => {
            expect(tokenize('-.a')).toEqual([makeIdentifier('-.a')])
        })

        it('tokenizes an identifier until a comment', () => {
            expect(tokenize('asd;f')).toEqual([makeIdentifier('asd')])
        })

        it('tokenizes an identifier until a paren', () => {
            expect(tokenize('asd)f')).toEqual([makeIdentifier('asd'), makeClosed(')'), makeIdentifier('f')])
        })
    })

    it('tokenizes a paren', () => {
        expect(tokenize('(')).toEqual([makeOpen('(')])
        expect(tokenize(')')).toEqual([makeClosed(')')])
    })

    describe('comments', () => {
        it('tokenizes a single line comment', () => {
            expect(tokenize(';')).toEqual([])
            expect(tokenize(';comment')).toEqual([])
            expect(tokenize(';;comment')).toEqual([])
            expect(tokenize('123 ;comment')).toEqual([makeNumber(123)])
            expect(tokenize('123 ;;comment\n321')).toEqual([makeNumber(123), makeNumber(321)])
        })

        it('tokenizes a multi-line comment', () => {
            expect(tokenize(';--;')).toEqual([])
            expect(tokenize(';-asd\nasd-;')).toEqual([])
        })

        it('throws an exception when parsing a non-terminated multi-line comment', () => {
            expect(tokenize.bind(null, ';-;')).toThrow(new Error('Multiline comment not terminated'))
            expect(tokenize.bind(null, ';-')).toThrow(new Error('Multiline comment not terminated'))
        })
    })

    describe('strings', () => {
        it('tokenizes an empty string', () => {
            expect(tokenize('""')).toEqual([makeString('')])
        })

        it('tokenizes a string', () => {
            expect(tokenize('"asd"')).toEqual([makeString('asd')])
        })

        it('tokenizes a string containing a comment', () => {
            expect(tokenize('"a;sd"')).toEqual([makeString('a;sd')])
            expect(tokenize('"a;-s-;d"')).toEqual([makeString('a;-s-;d')])
        })

        it('throws an exception on a non-terminated double-quoted string', () => {
            expect(tokenize.bind(null, '"')).toThrow(new Error('String not terminated'))
        })

        it('throws an exception on a double-quoted string containing new-line', () => {
            expect(tokenize.bind(null, '"a\nsd"')).toThrow(new Error('String not terminated'))
        })

        describe('string escaping', () => {
            it('unescapes \\n', () => {
                const string = '"\\n"'
                expect(tokenize(string)).toEqual([makeString(eval(string))])
            })

            it('unescapes \\\\', () => {
                const string = '"\\\\"'
                expect(tokenize(string)).toEqual([makeString(eval(string))])
            })

            it('unescapes \\"', () => {
                const string = '"\\""'
                expect(tokenize(string)).toEqual([makeString(eval(string))])
            })

            it('unescapes \'', () => {
                const string = '"\'"'
                expect(tokenize(string)).toEqual([makeString(eval(string))])
            })

            it('unescapes a complex string', () => {
                const string = '"a\\ns\\tz\'dfg\'\'\'h"'
                expect(tokenize(string)).toEqual([makeString(eval(string))])
            })
        })
    })

    describe('prefixes', () => {
        it('tokenizes a prefix', () => {
            expect(tokenize("#")).toEqual([makePrefix('#')])
        })

        it('tokenizes a prefix before an identifier', () => {
            expect(tokenize("#asd")).toEqual([makePrefix('#'), makeIdentifier('asd')])
        })

        it('tokenizes multiple prefixes', () => {
            expect(tokenize("#@@")).toEqual([makePrefix('#'), makePrefix('@'), makePrefix('@')])
        })
    })
})
