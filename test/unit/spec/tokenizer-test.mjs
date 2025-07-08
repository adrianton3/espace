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

        it('tokenizes a binary number', () => {
            expect(tokenize('0b0')).toEqual([makeNumber(0b0)])
            expect(tokenize('0b1')).toEqual([makeNumber(0b1)])
            expect(tokenize('0b000')).toEqual([makeNumber(0b000)])
            expect(tokenize('0b001')).toEqual([makeNumber(0b001)])
            expect(tokenize('0b100')).toEqual([makeNumber(0b100)])
            expect(tokenize('0b111')).toEqual([makeNumber(0b111)])
        })

        it('tokenizes a negative binary number', () => {
            expect(tokenize('-0b0')).toEqual([makeNumber(0b0)])
            expect(tokenize('-0b1')).toEqual([makeNumber(-0b1)])
            expect(tokenize('-0b000')).toEqual([makeNumber(0b000)])
            expect(tokenize('-0b001')).toEqual([makeNumber(-0b001)])
            expect(tokenize('-0b100')).toEqual([makeNumber(-0b100)])
            expect(tokenize('-0b111')).toEqual([makeNumber(-0b111)])
        })

        it('tokenizes a hexadecimal number', () => {
            expect(tokenize('0x0')).toEqual([makeNumber(0x0)])
            expect(tokenize('0x1')).toEqual([makeNumber(0x1)])
            expect(tokenize('0x000')).toEqual([makeNumber(0x000)])
            expect(tokenize('0x00f')).toEqual([makeNumber(0x00f)])
            expect(tokenize('0x02C')).toEqual([makeNumber(0x02C)])
            expect(tokenize('0x100')).toEqual([makeNumber(0x100)])
            expect(tokenize('0xabc')).toEqual([makeNumber(0xabc)])
            expect(tokenize('0xABC')).toEqual([makeNumber(0xABC)])
        })

        it('tokenizes a negative hexadecimal number', () => {
            expect(tokenize('-0x0')).toEqual([makeNumber(0x0)])
            expect(tokenize('-0x1')).toEqual([makeNumber(-0x1)])
            expect(tokenize('-0x000')).toEqual([makeNumber(0x000)])
            expect(tokenize('-0x00f')).toEqual([makeNumber(-0x00f)])
            expect(tokenize('-0x02C')).toEqual([makeNumber(-0x02C)])
            expect(tokenize('-0x100')).toEqual([makeNumber(-0x100)])
            expect(tokenize('-0xabc')).toEqual([makeNumber(-0xabc)])
            expect(tokenize('-0xABC')).toEqual([makeNumber(-0xABC)])
        })

        it('throws an exception when given a number followed by non-separators', () => {
            expect(tokenize.bind(null, '123A')).toThrow(new Error("Unexpected character 'A'"))
            // half pi
            expect(tokenize.bind(null, '3.14.5')).toThrow(new Error("Unexpected character '.'"))
        })

        it('throws an exception when tokenizing an incomplete binary number', () => {
            expect(tokenize.bind(null, '0b')).toThrow(new Error("Number not terminated"))
            expect(tokenize.bind(null, '-0b')).toThrow(new Error("Number not terminated"))
        })

        it('throws an exception when given a binary number that starts with 2', () => {
            expect(tokenize.bind(null, '0b2')).toThrow(new Error("Unexpected character '2'"))
            expect(tokenize.bind(null, '-0b2')).toThrow(new Error("Unexpected character '2'"))
        })

        it('throws an exception when given a binary number followed by non-separators', () => {
            expect(tokenize.bind(null, '0b102')).toThrow(new Error("Unexpected character '2'"))
            expect(tokenize.bind(null, '0b10A')).toThrow(new Error("Unexpected character 'A'"))
            expect(tokenize.bind(null, '0b11!')).toThrow(new Error("Unexpected character '!'"))
            expect(tokenize.bind(null, '-0b102')).toThrow(new Error("Unexpected character '2'"))
            expect(tokenize.bind(null, '-0b10A')).toThrow(new Error("Unexpected character 'A'"))
            expect(tokenize.bind(null, '-0b11!')).toThrow(new Error("Unexpected character '!'"))
        })

        it('throws an exception when tokenizing an incomplete hexadecimal number', () => {
            expect(tokenize.bind(null, '0x')).toThrow(new Error("Number not terminated"))
            expect(tokenize.bind(null, '-0x')).toThrow(new Error("Number not terminated"))
        })

        it('throws an exception when given a hexadecimal number that starts with g', () => {
            expect(tokenize.bind(null, '0xg')).toThrow(new Error("Unexpected character 'g'"))
            expect(tokenize.bind(null, '-0xg')).toThrow(new Error("Unexpected character 'g'"))
        })

        it('throws an exception when given a hexadecimal number followed by non-separators', () => {
            expect(tokenize.bind(null, '0x10G')).toThrow(new Error("Unexpected character 'G'"))
            expect(tokenize.bind(null, '0x10g')).toThrow(new Error("Unexpected character 'g'"))
            expect(tokenize.bind(null, '0x11!')).toThrow(new Error("Unexpected character '!'"))
            expect(tokenize.bind(null, '-0x10G')).toThrow(new Error("Unexpected character 'G'"))
            expect(tokenize.bind(null, '-0x10g')).toThrow(new Error("Unexpected character 'g'"))
            expect(tokenize.bind(null, '-0x11!')).toThrow(new Error("Unexpected character '!'"))
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
