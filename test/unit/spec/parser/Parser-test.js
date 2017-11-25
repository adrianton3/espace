'use strict'

describe('Parser', () => {
	const { parse } = espace.Parser

	const makeToken = (type) => (value) => ({ type, value })

	const makeNumber = makeToken('number')
	const makeString = makeToken('string')
	const makeIdentifier = makeToken('identifier')
	const makePrefix = makeToken('prefix')
	const makeOpen = makeToken('open')
	const makeClosed = makeToken('closed')

	const makeAst = {
		atom: (type, value) => ({
			type: 'atom',
			token: {
				type,
				value,
			},
		}),
		list: (value, children = []) => ({
			type: 'list',
			token: {
				type: 'open',
				value,
			},
			children,
		}),
		prefix: (value, child) => ({
			type: 'list',
			token: {
				type: 'prefix',
				value,
			},
			children: [
				makeAst.atom('identifier', value),
				child,
			],
		}),
	}

	it('can parse nothing', () => {
		const tokens = []

		expect(parse(tokens)).toBeNull()
	})

	it('can parse an atom', () => {
		const tokens = [makeNumber(123)]

		expect(parse(tokens)).toEqual(makeAst.atom('number', 123))
	})

	it('can parse an empty paren', () => {
		const tokens = [
			makeOpen('('),
			makeClosed(')'),
		]

		expect(parse(tokens)).toEqual(makeAst.list('('))
	})

	it('can parse a one element paren', () => {
		const tokens = [
			makeOpen('('),
			makeIdentifier('x'),
			makeClosed(')'),
		]

		expect(parse(tokens)).toEqual(
			makeAst.list('(', [
				makeAst.atom('identifier', 'x'),
			])
		)
	})

	it('can parse a two element paren', () => {
		const tokens = [
			makeOpen('('),
			makeIdentifier('x'),
			makeIdentifier('y'),
			makeClosed(')'),
		]

		expect(parse(tokens)).toEqual(
			makeAst.list('(', [
				makeAst.atom('identifier', 'x'),
				makeAst.atom('identifier', 'y'),
			])
		)
	})

	it('can parse a nested empty paren', () => {
		const tokens = [
			makeOpen('('),
			makeOpen('('),
			makeClosed(')'),
			makeClosed(')'),
		]

		expect(parse(tokens)).toEqual(
			makeAst.list('(', [
				makeAst.list('(', []),
			])
		)
	})

	it('can parse nested parens of all types', () => {
		const tokens = [
			makeOpen('('),
			makeOpen('['),
			makeOpen('{'),
			makeClosed('}'),
			makeClosed(']'),
			makeClosed(')'),
		]

		expect(parse(tokens)).toEqual(
			makeAst.list('(', [
				makeAst.list('[', [
					makeAst.list('{', []),
				])
			])
		)
	})

	it('can parse a one element nested paren', () => {
		const tokens = [
			makeOpen('('),
			makeOpen('('),
			makeIdentifier('x'),
			makeClosed(')'),
			makeClosed(')'),
		]

		expect(parse(tokens)).toEqual(
			makeAst.list('(', [
				makeAst.list('(', [
					makeAst.atom('identifier', 'x'),
				]),
			])
		)
	})

	it('can parse a complex expression', () => {
		const tokens = [
			makeOpen('('),
			makeIdentifier('x'),
			makeOpen('('),
			makeIdentifier('y'),
			makeClosed(')'),
			makeIdentifier('z'),
			makeOpen('('),
			makeClosed(')'),
			makeClosed(')'),
		]

		expect(parse(tokens)).toEqual(
			makeAst.list('(', [
				makeAst.atom('identifier', 'x'),
				makeAst.list('(', [
					makeAst.atom('identifier', 'y'),
				]),
				makeAst.atom('identifier', 'z'),
				makeAst.list('(', []),
			])
		)
	})

	it('can parse a prefixed number', () => {
		const tokens = [
			makePrefix('#'),
			makeIdentifier('x'),
		]

		expect(parse(tokens)).toEqual(
			makeAst.prefix('#',
				makeAst.atom('identifier', 'x'),
			)
		)
	})

	it('can parse a prefixed (', () => {
		const tokens = [
			makePrefix('#'),
			makeOpen('('),
			makeClosed(')'),
		]

		expect(parse(tokens)).toEqual(
			makeAst.prefix('#',
				makeAst.list('(', []),
			)
		)
	})

	it('can parse a doubly prefixed (', () => {
		const tokens = [
			makePrefix('@'),
			makePrefix('#'),
			makeOpen('('),
			makeClosed(')'),
		]

		expect(parse(tokens)).toEqual(
			makeAst.prefix('@',
				makeAst.prefix('#',
					makeAst.list('(', []),
				)
			)
		)
	})

	it('throws an exception when trying to parse just (', () => {
		const tokens = [makeOpen('(')]

		expect(parse.bind(null, tokens)).toThrow(new Error('Missing )'))
	})

	it('throws an exception when starting with a )', () => {
		const tokens = [makeClosed(')')]

		expect(parse.bind(null, tokens)).toThrow(new Error('Cannot start with )'))
	})

	it('throws an exception when trying to parse ())', () => {
		const tokens = [
			makeOpen('('),
			makeClosed(')'),
			makeClosed(')'),
		]

		expect(parse.bind(null, tokens)).toThrow(new Error('Unexpected token'))
	})

	it('throws an exception when given more than one atom', () => {
		const tokens = [
			makeIdentifier('x'),
			makeIdentifier('y'),
		]

		expect(parse.bind(null, tokens)).toThrow(new Error('Unexpected token'))
	})

	it('throws an exception when parsing *()', () => {
		const tokens = [
			makeIdentifier('*'),
			makeOpen('('),
			makeClosed(')'),
		]

		expect(parse.bind(null, tokens)).toThrow(new Error('Unexpected token'))
	})

	it('throws an exception when parsing ()*', () => {
		const tokens = [
			makeOpen('('),
			makeClosed(')'),
			makeIdentifier('*'),
		]

		expect(parse.bind(null, tokens)).toThrow(new Error('Unexpected token'))
	})

	it('throws an exception when parsing ()()', () => {
		const tokens = [
			makeOpen('('),
			makeClosed(')'),
			makeOpen('('),
			makeClosed(')'),
		]

		expect(parse.bind(null, tokens)).toThrow(new Error('Unexpected token'))
	})

	it('throws an exception when parsing (]', () => {
		const tokens = [
			makeOpen('('),
			makeClosed(']'),
		]

		expect(parse.bind(null, tokens)).toThrow(new Error('Paren types must match'))
	})
})
