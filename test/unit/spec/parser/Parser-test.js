describe('Parser', function () {
	var Parser = espace.Parser;
	var parse = Parser.parse;

	it('can parse nothing', function () {
		var tokens = [];
		expect(parse(tokens)).toBeNull();
	});

    it('can parse an atom', function () {
        var tokens = [{
            type: 'x',
            value: 123
        }];
        expect(parse(tokens)).toEqual({
			token: {
				type: 'x',
				value: 123
			}
		});
    });

    it('can parse an empty paren', function () {
        var tokens = [{
            type: '(',
            value: 123
        }, {
            type: ')',
            value: 234
        }];
        expect(parse(tokens)).toEqual({
            token: {
                type: '(',
                value: 123
            },
            tree: []
        });
    });

    it('can parse a one element paren', function () {
        var tokens = [{
            type: '(',
            value: 123
        }, {
            type: 'x',
            value: 234
        }, {
            type: ')',
            value: 345
        }];
        expect(parse(tokens)).toEqual({
            token: {
                type: '(',
                value: 123
            },
            tree: [{
				token: {
					type: 'x',
					value: 234
				}
            }]
        });
    });

    it('can parse a two element paren', function () {
        var tokens = [{
            type: '(',
            value: 123
        }, {
            type: 'x',
            value: 234
        }, {
            type: 'y',
            value: 345
        }, {
            type: ')',
            value: 456
        }];
        expect(parse(tokens)).toEqual({
            token: {
                type: '(',
                value: 123
            },
            tree: [{
				token: {
					type: 'x',
					value: 234
				}
            }, {
				token: {
					type: 'y',
					value: 345
				}
            }]
        });
    });

    it('can parse a nested empty paren', function () {
        var tokens = [{
            type: '(',
            value: 123
        }, {
            type: '(',
            value: 234
        }, {
            type: ')',
            value: 345
        }, {
            type: ')',
            value: 456
        }];
        expect(parse(tokens)).toEqual({
            token: {
                type: '(',
                value: 123
            },
            tree: [{
                token: {
                    type: '(',
                    value: 234
                },
                tree: []
            }]
        });
    });

    it('can parse a one element nested paren', function () {
        var tokens = [{
            type: '(',
            value: 123
        }, {
            type: '(',
            value: 234
        }, {
            type: 'x',
            value: 345
        }, {
            type: ')',
            value: 456
        }, {
            type: ')',
            value: 567
        }];
        expect(parse(tokens)).toEqual({
            token: {
                type: '(',
                value: 123
            },
            tree: [{
                token: {
                    type: '(',
                    value: 234
                },
                tree: [{
					token: {
						type: 'x',
						value: 345
					}
                }]
            }]
        });
    });

    it('can parse a complex expression', function () {
        var tokens = [{
            type: '(',
            value: 11
        }, {
            type: 'a',
            value: 22
        }, {
            type: '(',
            value: 33
        }, {
            type: 'b',
            value: 44
        }, {
            type: ')',
            value: 55
        }, {
            type: 'c',
            value: 66
        }, {
            type: '(',
            value: 77
        }, {
            type: ')',
            value: 88
        }, {
            type: ')',
            value: 99
        }];
        expect(parse(tokens)).toEqual({
            token: {
                type: '(',
                value: 11
            },
            tree: [{
				token: {
					type: 'a',
					value: 22
				}
        	}, {
                token: {
                    type: '(',
                    value: 33
                },
                tree: [{
					token: {
						type: 'b',
						value: 44
					}
                }]
            }, {
				token: {
					type: 'c',
					value: 66
				}
        	}, {
                token: {
                    type: '(',
                    value: 77
                },
                tree: []
            }]
        });
    });

	it('throws an exception when trying to parse just (', function () {
		var tokens = [{
			type: '('
		}];
		expect(parse.bind(null, tokens)).toThrow(new Error('Missing )'));
	});

	it('throws an exception when starting with a )', function () {
		var tokens = [{
			type: ')'
		}];
		expect(parse.bind(null, tokens)).toThrow(new Error('Cannot start with )'));
	});

	it('throws an exception when trying to parse ())', function () {
		var tokens = [{
			type: '('
		}, {
			type: ')'
		}, {
			type: ')'
		}];
		expect(parse.bind(null, tokens)).toThrow(new Error('Unexpected token'));
	});

	it('throws an exception when given more than one atom', function () {
		var tokens = [{
			type: 'number',
			value: 11
		}, {
			type: 'number',
			value: 22
		}];
		expect(parse.bind(null, tokens)).toThrow(new Error('Unexpected token'));
	});

	it('throws an exception when parsing *()', function () {
		var tokens = [{
			type: '*'
		}, {
			type: '('
		}, {
			type: ')'
		}];
		expect(parse.bind(null, tokens)).toThrow(new Error('Unexpected token'));
	});

	it('throws an exception when parsing ()*', function () {
		var tokens = [{
			type: '('
		}, {
			type: ')'
		}, {
			type: '*'
		}];
		expect(parse.bind(null, tokens)).toThrow(new Error('Unexpected token'));
	});

	it('throws an exception when parsing ()()', function () {
		var tokens = [{
			type: '('
		}, {
			type: ')'
		}, {
			type: '('
		}, {
			type: ')'
		}];
		expect(parse.bind(null, tokens)).toThrow(new Error('Unexpected token'));
	});
});
