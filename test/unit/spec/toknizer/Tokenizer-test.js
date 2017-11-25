'use strict'

describe('Tokenizer', () => {
	const makeToken = (type) => (value) => ({ type, value })

	const makeNumber = makeToken('number')
	const makeString = makeToken('string')
	const makeIdentifier = makeToken('identifier')
	const makePrefix = makeToken('prefix')
	const makeOpen = makeToken('open')
	const makeClosed = makeToken('closed')

	const chop = espace.Tokenizer({
		prefixes: {
			'#': '#',
			'@': '@',
		},
	})

	it('can tokenize an empty string', () => {
		expect(chop('')).toEqual([])
	})

	describe('numbers', () => {
		it('can tokenize a number', () => {
			expect(chop('0')).toEqual([{
				type: 'number',
				value: 0,
			}])

			expect(chop('1234')).toEqual([{
				type: 'number',
				value: 1234,
			}])
		})

		it('can tokenize a floating point number', () => {
			expect(chop('0.1')).toEqual([{
				type: 'number',
				value: 0.1,
			}])

			expect(chop('12.34')).toEqual([{
				type: 'number',
				value: 12.34,
			}])
		})

		it('throws an exception when given a number followed by non-separators', () => {
			expect(chop.bind(null, '123A')).toThrow(new Error("Unexpected character 'A' after '123'"))
			// half pi
			expect(chop.bind(null, '3.14.5')).toThrow(new Error("Unexpected character '.' after '3.14'"))
		})
	})

	describe('whitespace', () => {
		const chopW = espace.Tokenizer({ whitespace: true })

		it('can ignore whitespace', () => {
			expect(chop(' ')).toEqual([])
			expect(chop('\n')).toEqual([])
			expect(chop('\t')).toEqual([])
			expect(chop('  \n\t  ')).toEqual([])
			expect(chop('\n  \n1234\t ')).toEqual([{
				type: 'number',
				value: 1234,
			}])
		})

		it('can preserve whitespace', () => {
			expect(chopW(' ')).toEqual([{
				type: 'whitespace',
				value: ' ',
			}])
			expect(chopW('\n')).toEqual([{
				type: 'whitespace',
				value: '\n',
			}])
			expect(chopW('\t')).toEqual([{
				type: 'whitespace',
				value: '\t',
			}])
			expect(chopW('  \n\t ')).toEqual([{
				type: 'whitespace',
				value: ' ',
			}, {
				type: 'whitespace',
				value: ' ',
			}, {
				type: 'whitespace',
				value: '\n',
			}, {
				type: 'whitespace',
				value: '\t',
			}, {
				type: 'whitespace',
				value: ' ',
			}])
		})
	})

	it('can tokenize an identifier', () => {
		expect(chop('a1234')).toEqual([{
			type: 'identifier',
			value: 'a1234',
		}])
	})

	it('can tokenize a paren', () => {
		expect(chop('(')).toEqual([makeOpen('(')])
		expect(chop(')')).toEqual([makeClosed(')')])
	})

	describe('comments', () => {
		const chopC = espace.Tokenizer({ comments: true })

		it('can tokenize a single line comment', () => {
			expect(chop(';')).toEqual([])
			expect(chop(';comment')).toEqual([])
			expect(chop(';;comment')).toEqual([])
		})

		it('can tokenize a single line comment and extract it', () => {
			expect(chopC(';')).toEqual([{
				type: 'comment',
				value: '',
			}])
			expect(chopC(';comment')).toEqual([{
				type: 'comment',
				value: 'comment',
			}])
			expect(chopC(';;comment')).toEqual([{
				type: 'comment',
				value: ';comment',
			}])
		})

		it('can tokenize a multi-line comment', () => {
			expect(chop(';--;')).toEqual([])
			expect(chop(';-asd\nasd-;')).toEqual([])
		})

		it('can tokenize a multi-line comment and extract it', () => {
			expect(chopC(';--;')).toEqual([{
				type: 'comment',
				value: '',
			}])
			expect(chopC(';-asd\nasd-;')).toEqual([{
				type: 'comment',
				value: 'asd\nasd',
			}])
		})

		it('throws an exception when parsing a non-terminated multi-line comment', () => {
			expect(chop.bind(null, ';-;')).toThrow(new Error('Multiline comment not properly terminated'))
			expect(chop.bind(null, ';-')).toThrow(new Error('Multiline comment not properly terminated'))
		})
	})

	describe('strings', () => {
		it('can tokenize a single-quoted empty string', () => {
			expect(chop("''")).toEqual([makeString('')])
		})

		it('can tokenize a single-quoted string', () => {
			expect(chop("'asd'")).toEqual([makeString('asd')])
		})

		it('throws an exception on a non-terminated single-quoted string', () => {
			expect(chop.bind(null, "'")).toThrow(new Error('String not properly ended'))
		})

		it('throws an exception on a single-quoted string containing new-line', () => {
			expect(chop.bind(null, "'a\nsd'")).toThrow(new Error('String not properly ended'))
		})

		it('can tokenize a double-quoted empty string', () => {
			expect(chop('""')).toEqual([makeString('')])
		})

		it('can tokenize a double-quoted string', () => {
			expect(chop('"asd"')).toEqual([makeString('asd')])
		})

		it('throws an exception on a non-terminated double-quoted string', () => {
			expect(chop.bind(null, '"')).toThrow(new Error('String not properly ended'))
		})

		it('throws an exception on a double-quoted string containing new-line', () => {
			expect(chop.bind(null, '"a\nsd"')).toThrow(new Error('String not properly ended'))
		})

		describe('single-quoted string escaping', () => {
			it('unescapes \\n', () => {
				const string = "'\\n'"
				expect(chop(string)).toEqual([makeString(eval(string))])
			})

			it('unescapes \\\\', () => {
				const string = "'\\\\'"
				expect(chop(string)).toEqual([makeString(eval(string))])
			})

			it('unescapes \\\"', () => {
				const string = "'\\\"'"
				expect(chop(string)).toEqual([makeString(eval(string))])
			})

			it('unescapes \\\'', () => {
				const string = "'\\\''"
				expect(chop(string)).toEqual([makeString(eval(string))])
			})

			it('unescapes \"', () => {
				const string = "'\"'"
				expect(chop(string)).toEqual([makeString(eval(string))])
			})

			it('unescapes a complex string', () => {
				const string = "'a\\ns\\tz\"dfg\"\"\"h'"
				expect(chop(string)).toEqual([makeString(eval(string))])
			})
		})

		describe('double-quoted string escaping', () => {
			it('unescapes \\n', () => {
				const string = '"\\n"'
				expect(chop(string)).toEqual([makeString(eval(string))])
			})

			it('unescapes \\\\', () => {
				const string = '"\\\\"'
				expect(chop(string)).toEqual([makeString(eval(string))])
			})

			it('unescapes \\\"', () => {
				const string = '"\\\""'
				expect(chop(string)).toEqual([makeString(eval(string))])
			})

			it('unescapes \\\'', () => {
				const string = '"\\\'"'
				expect(chop(string)).toEqual([makeString(eval(string))])
			})

			it('unescapes \'', () => {
				const string = '"\'"'
				expect(chop(string)).toEqual([makeString(eval(string))])
			})

			it('unescapes a complex string', () => {
				const string = '"a\\ns\\tz\'dfg\'\'\'h"'
				expect(chop(string)).toEqual([makeString(eval(string))])
			})
		})
	})

	describe('prefixes', () => {
		it('can tokenize a prefix', () => {
			expect(chop("#")).toEqual([makePrefix('#')])
		})

		it('can tokenize a prefix before an identifier', () => {
			expect(chop("#asd")).toEqual([makePrefix('#'), makeIdentifier('asd')])
		})

		it('can tokenize multiple prefixes', () => {
			expect(chop("#@@")).toEqual([makePrefix('#'), makePrefix('@'), makePrefix('@')])
		})
	})
})
