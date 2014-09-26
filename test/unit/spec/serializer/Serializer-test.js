describe('Serializer', function () {
	var Serializer = window.espace.Serializer;
	var serialize = Serializer.serialize;

	it('can serialize a number', function () {
		var tree = {
			token: {
				type: 'number',
				value: 123
			}
		};
		expect(serialize(tree)).toEqual('123');
	});

	it('can serialize a string', function () {
		var tree = {
			token: {
				type: 'string',
				value: 'asd'
			}
		};
		expect(serialize(tree)).toEqual('"asd"');
	});

	it('can serialize an identifier', function () {
		var tree = {
			token: {
				type: 'identifier',
				value: 'asd'
			}
		};
		expect(serialize(tree)).toEqual('asd');
	});

	it('can serialize an empty paren', function () {
		var tree = {
			token: {
				type: '('
			},
			children: []
		};
		expect(serialize(tree)).toEqual('()');
	});

	it('can serialize a nested empty paren', function () {
		var tree = {
			token: {
				type: '('
			},
			children: [{
				token: {
					type: '('
				},
				children: []
			}]
		};
		expect(serialize(tree)).toEqual('(())');
	});

	it('can serialize an expression', function () {
		var tree = {
			token: {
				type: '('
			},
			children: [{
				token: {
					type: 'identifier',
					value: '+'
				}
			}, {
				token: {
					type: 'number',
					value: 123
				}
			}, {
				token: {
					type: 'number',
					value: 456
				}
			}]
		};
		expect(serialize(tree)).toEqual('(+ 123 456)');
	});
});