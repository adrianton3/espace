describe('Parser', function () {
	var Parser = espace.Parser;
	var parse = Parser.parse;

    it('can parse an atom', function () {
        var tokens = [{
            type: 'x',
            value: 123
        }];
        expect(parse(tokens)).toEqual(tokens[0]);
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
                type: 'x',
                value: 234
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
                type: 'x',
                value: 234
            }, {
                type: 'y',
                value: 345
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
                    type: 'x',
                    value: 345
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
				type: 'a',
            	value: 22
        	}, {
                token: {
                    type: '(',
                    value: 33
                },
                tree: [{
                    type: 'b',
                    value: 44
                }]
            }, {
				type: 'c',
            	value: 66
        	}, {
                token: {
                    type: '(',
                    value: 77
                },
                tree: []
            }]
        });
    });
});
