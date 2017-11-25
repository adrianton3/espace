'use strict'

describe('Tokenizer', () => {
	const makeToken = (type) => (value) => ({ type, value })

	const makeNumber = makeToken('number')
	const makeString = makeToken('string')
	const makeIdentifier = makeToken('identifier')
	const makePrefix = makeToken('prefix')
	const makeOpen = makeToken('open')
	const makeClosed = makeToken('closed')

	const tokenize = (string) => espace.Tokenizer.tokenize(string, {
		prefixes: {
			'#': '#',
			'@': '@',
		},
	})

	it('can tokenize an empty string', () => {
		expect(tokenize('')).toEqual([])
	})

	describe('numbers', () => {
		it('can tokenize a number', () => {
			expect(tokenize('0')).toEqual([{
				type: 'number',
				value: 0,
			}])

			expect(tokenize('1234')).toEqual([{
				type: 'number',
				value: 1234,
			}])
		})

		it('can tokenize a floating point number', () => {
			expect(tokenize('0.1')).toEqual([{
				type: 'number',
				value: 0.1,
			}])

			expect(tokenize('12.34')).toEqual([{
				type: 'number',
				value: 12.34,
			}])
		})

		it('throws an exception when given a number followed by non-separators', () => {
			expect(tokenize.bind(null, '123A')).toThrow(new Error("Unexpected character 'A' after '123'"))
			// half pi
			expect(tokenize.bind(null, '3.14.5')).toThrow(new Error("Unexpected character '.' after '3.14'"))
		})
	})

	describe('whitespace', () => {
		const tokenize = (string) =>
			espace.Tokenizer.tokenize(string, { whitespace: true })

		it('can ignore whitespace', () => {
			const tokenize = (string) =>
				espace.Tokenizer.tokenize(string, { whitespace: false })

			expect(tokenize(' ')).toEqual([])
			expect(tokenize('\n')).toEqual([])
			expect(tokenize('\t')).toEqual([])
			expect(tokenize('  \n\t  ')).toEqual([])
			expect(tokenize('\n  \n1234\t ')).toEqual([{
				type: 'number',
				value: 1234,
			}])
		})

		it('can preserve whitespace', () => {
			expect(tokenize(' ')).toEqual([{
				type: 'whitespace',
				value: ' ',
			}])
			expect(tokenize('\n')).toEqual([{
				type: 'whitespace',
				value: '\n',
			}])
			expect(tokenize('\t')).toEqual([{
				type: 'whitespace',
				value: '\t',
			}])
			expect(tokenize('  \n\t ')).toEqual([{
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
		expect(tokenize('a1234')).toEqual([{
			type: 'identifier',
			value: 'a1234',
		}])
	})

	it('can tokenize a paren', () => {
		expect(tokenize('(')).toEqual([makeOpen('(')])
		expect(tokenize(')')).toEqual([makeClosed(')')])
	})

	describe('comments', () => {
		describe('ignore', () => {
			it('can tokenize a single line comment', () => {
				expect(tokenize(';')).toEqual([])
				expect(tokenize(';comment')).toEqual([])
				expect(tokenize(';;comment')).toEqual([])
			})

			it('can tokenize a multi-line comment', () => {
				expect(tokenize(';--;')).toEqual([])
				expect(tokenize(';-asd\nasd-;')).toEqual([])
			})
		})

		describe('preserve', () => {
			const tokenize = (string) =>
				espace.Tokenizer.tokenize(string, { comments: true })

			it('can tokenize a single line comment and extract it', () => {
				expect(tokenize(';')).toEqual([{
					type: 'comment',
					value: '',
				}])
				expect(tokenize(';comment')).toEqual([{
					type: 'comment',
					value: 'comment',
				}])
				expect(tokenize(';;comment')).toEqual([{
					type: 'comment',
					value: ';comment',
				}])
			})

			it('can tokenize a multi-line comment and extract it', () => {
				expect(tokenize(';--;')).toEqual([{
					type: 'comment',
					value: '',
				}])
				expect(tokenize(';-asd\nasd-;')).toEqual([{
					type: 'comment',
					value: 'asd\nasd',
				}])
			})
		})

		it('throws an exception when parsing a non-terminated multi-line comment', () => {
			expect(tokenize.bind(null, ';-;')).toThrow(new Error('Multiline comment not properly terminated'))
			expect(tokenize.bind(null, ';-')).toThrow(new Error('Multiline comment not properly terminated'))
		})
	})

	describe('strings', () => {
		it('can tokenize a double-quoted empty string', () => {
			expect(tokenize('""')).toEqual([makeString('')])
		})

		it('can tokenize a double-quoted string', () => {
			expect(tokenize('"asd"')).toEqual([makeString('asd')])
		})

		it('throws an exception on a non-terminated double-quoted string', () => {
			expect(tokenize.bind(null, '"')).toThrow(new Error('String not properly ended'))
		})

		it('throws an exception on a double-quoted string containing new-line', () => {
			expect(tokenize.bind(null, '"a\nsd"')).toThrow(new Error('String not properly ended'))
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

			it('unescapes \\\"', () => {
				const string = '"\\\""'
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
		it('can tokenize a prefix', () => {
			expect(tokenize("#")).toEqual([makePrefix('#')])
		})

		it('can tokenize a prefix before an identifier', () => {
			expect(tokenize("#asd")).toEqual([makePrefix('#'), makeIdentifier('asd')])
		})

		it('can tokenize multiple prefixes', () => {
			expect(tokenize("#@@")).toEqual([makePrefix('#'), makePrefix('@'), makePrefix('@')])
		})
	})
})
