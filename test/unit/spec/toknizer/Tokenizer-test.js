describe('Tokenizer', function () {
	var chop = espace.Tokenizer();

    it('can tokenize an empty string', function () {
        expect(chop('')).toEqual([]);
    });

    it('can tokenize a number', function () {
        expect(chop('0')).toEqual([{
			type: 'number',
			value: 0
        }]);

        expect(chop('1234')).toEqual([{
			type: 'number',
			value: 1234
        }]);
    });

	it('can tokenize a floating point number', function () {
        expect(chop('0.1')).toEqual([{
			type: 'number',
			value: 0.1
        }]);

        expect(chop('12.34')).toEqual([{
			type: 'number',
			value: 12.34
        }]);
    });

	it('throws an exception when given a number followed by non-separators', function () {
		expect(chop.bind(null, '123A')).toThrow(new Error("Unexpected character 'A' after '123'"));
		// half pi
		expect(chop.bind(null, '3.14.5')).toThrow(new Error("Unexpected character '.' after '3.14'"));
	});

    it('can ignore whitespace', function () {
        expect(chop('  \n\t  ')).toEqual([]);
        expect(chop('\n  \n1234\t ')).toEqual([{
			type: 'number',
			value: 1234
        }]);
    });

    it('can tokenize an alphanum', function () {
        expect(chop('a1234')).toEqual([{
			type: 'alphanum',
			value: 'a1234'
        }]);
    });

    it('can tokenize a paren', function () {
        expect(chop('(')).toEqual([{
			type: '('
        }]);
        expect(chop(')')).toEqual([{
			type: ')'
        }]);
    });

    it('can tokenize a single line comment', function () {
        expect(chop(';')).toEqual([]);
        expect(chop(';comment')).toEqual([]);
        expect(chop(';;comment')).toEqual([]);
    });

    it('can tokenize a multi-line comment', function () {
        expect(chop(';--;')).toEqual([]);
        expect(chop(';-asd\nasd-;')).toEqual([]);
    });

	it('throws an exception when parsing a non-terminated multi-line comment', function () {
		expect(chop.bind(null, ';-;')).toThrow(new Error('Multiline comment not properly terminated'));
		expect(chop.bind(null, ';-')).toThrow(new Error('Multiline comment not properly terminated'));
	});

	it('can tokenize a single-quoted empty string', function () {
		expect(chop("''")).toEqual([{
			type: 'string',
			value: ''
		}]);
	});

	it('can tokenize a single-quoted string', function () {
		expect(chop("'asd'")).toEqual([{
			type: 'string',
			value: 'asd'
		}]);
	});

	it('throws an exception on a non-terminated single-quoted string', function () {
		expect(chop.bind(null, "'")).toThrow(new Error('String not properly ended'));
	});

	it('throws an exception on a single-quoted string containing new-line', function () {
		expect(chop.bind(null, "'a\nsd'")).toThrow(new Error('String not properly ended'));
	});

	it('can tokenize a double-quoted empty string', function () {
		expect(chop('""')).toEqual([{
			type: 'string',
			value: ''
		}]);
	});

	it('can tokenize a double-quoted string', function () {
		expect(chop('"asd"')).toEqual([{
			type: 'string',
			value: 'asd'
		}]);
	});

	it('throws an exception on a non-terminated double-quoted string', function () {
		expect(chop.bind(null, '"')).toThrow(new Error('String not properly ended'));
	});

	it('throws an exception on a double-quoted string containing new-line', function () {
		expect(chop.bind(null, '"a\nsd"')).toThrow(new Error('String not properly ended'));
	});

	it('unescapes single-quoted strings', function () {
		var string = "'\\n'";
		expect(chop(string)).toEqual([{
			type: 'string',
			value: eval(string)
		}]);

		string = "'\\\\'";
		expect(chop(string)).toEqual([{
			type: 'string',
			value: eval(string)
		}]);

		string = "'a\\ns\\tz\"dfg\"\"\"h'";
		expect(chop(string)).toEqual([{
			type: 'string',
			value: eval(string)
		}]);
	});

	it('unescapes double-quoted strings', function () {
		var string = '"\\n"';
		expect(chop(string)).toEqual([{
			type: 'string',
			value: eval(string)
		}]);

		string = '"\\\\"';
		expect(chop(string)).toEqual([{
			type: 'string',
			value: eval(string)
		}]);

		string = '"a\\ns\\tz\'dfg\'\'\'h"';
		expect(chop(string)).toEqual([{
			type: 'string',
			value: eval(string)
		}]);
	});
});
