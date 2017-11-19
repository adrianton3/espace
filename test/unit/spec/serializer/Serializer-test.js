describe('Serializer', function () {
	const Serializer = window.espace.Serializer
	const serialize = Serializer.serialize

	it('can serialize a number', function () {
		const tree = {
			type: 'atom',
			token: {
				type: 'number',
				value: 123,
			},
		}

		expect(serialize(tree)).toEqual('123')
	})

	it('can serialize a string', function () {
		const tree = {
			type: 'atom',
			token: {
				type: 'string',
				value: 'asd',
			},
		}

		expect(serialize(tree)).toEqual('"asd"')
	})

	it('can serialize an identifier', function () {
		const tree = {
			type: 'atom',
			token: {
				type: 'identifier',
				value: 'asd',
			},
		}

		expect(serialize(tree)).toEqual('asd')
	})

	it('can serialize an empty paren', function () {
		const tree = {
			type: 'list',
			token: {
				type: 'open',
				value: '(',
			},
			children: [],
		}

		expect(serialize(tree)).toEqual('()')
	})

	it('can serialize a nested empty paren', function () {
		const tree = {
			type: 'list',
			token: {
				type: 'open',
				value: '(',
			},
			children: [{
				type: 'list',
				token: {
					type: 'open',
					value: '(',
				},
				children: [],
			}],
		}

		expect(serialize(tree)).toEqual('(())')
	})

	it('can serialize an expression', function () {
		const tree = {
			type: 'list',
			token: {
				type: 'open',
				value: '(',
			},
			children: [{
				type: 'atom',
				token: {
					type: 'identifier',
					value: '+',
				},
			}, {
				type: 'atom',
				token: {
					type: 'number',
					value: 123,
				},
			}, {
				type: 'atom',
				token: {
					type: 'number',
					value: 456,
				},
			}],
		}

		expect(serialize(tree)).toEqual('(+ 123 456)')
	})
})
