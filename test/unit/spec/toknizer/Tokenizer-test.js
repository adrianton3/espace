describe('Tokenizer', function () {
	'use strict';

	var token = function (type, value) { return { type: type, value: value }; };
	var chop = espace.Tokenizer({ prefixes: '@#' });

    it('can tokenize an empty string', function () {
        expect(chop('')).toEqual([]);
    });

	describe('numbers', function () {
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
	});

	describe('whitespace', function () {
		var chopW = espace.Tokenizer({ whitespace: true });

		it('can ignore whitespace', function () {
			expect(chop(' ')).toEqual([]);
			expect(chop('\n')).toEqual([]);
			expect(chop('\t')).toEqual([]);
			expect(chop('  \n\t  ')).toEqual([]);
			expect(chop('\n  \n1234\t ')).toEqual([{
				type: 'number',
				value: 1234
			}]);
		});

		it('can preserve whitespace', function () {
			expect(chopW(' ')).toEqual([{
				type: 'whitespace',
				value: ' '
			}]);
			expect(chopW('\n')).toEqual([{
				type: 'whitespace',
				value: '\n'
			}]);
			expect(chopW('\t')).toEqual([{
				type: 'whitespace',
				value: '\t'
			}]);
			expect(chopW('  \n\t ')).toEqual([{
				type: 'whitespace',
				value: ' '
			}, {
				type: 'whitespace',
				value: ' '
			}, {
				type: 'whitespace',
				value: '\n'
			}, {
				type: 'whitespace',
				value: '\t'
			}, {
				type: 'whitespace',
				value: ' '
			}]);
		});
	});

    it('can tokenize an identifier', function () {
        expect(chop('a1234')).toEqual([{
			type: 'identifier',
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

	describe('comments', function () {
		var chopC = espace.Tokenizer({ comments: true });

		it('can tokenize a single line comment', function () {
			expect(chop(';')).toEqual([]);
			expect(chop(';comment')).toEqual([]);
			expect(chop(';;comment')).toEqual([]);
		});

		it('can tokenize a single line comment and extract it', function () {
			expect(chopC(';')).toEqual([{
				type: 'comment',
				value: ''
			}]);
			expect(chopC(';comment')).toEqual([{
				type: 'comment',
				value: 'comment'
			}]);
			expect(chopC(';;comment')).toEqual([{
				type: 'comment',
				value: ';comment'
			}]);
		});

		it('can tokenize a multi-line comment', function () {
			expect(chop(';--;')).toEqual([]);
			expect(chop(';-asd\nasd-;')).toEqual([]);
		});

		it('can tokenize a multi-line comment and extract it', function () {
			expect(chopC(';--;')).toEqual([{
				type: 'comment',
				value: ''
			}]);
			expect(chopC(';-asd\nasd-;')).toEqual([{
				type: 'comment',
				value: 'asd\nasd'
			}]);
		});

		it('throws an exception when parsing a non-terminated multi-line comment', function () {
			expect(chop.bind(null, ';-;')).toThrow(new Error('Multiline comment not properly terminated'));
			expect(chop.bind(null, ';-')).toThrow(new Error('Multiline comment not properly terminated'));
		});
	});

	describe('strings', function () {
		var tokenS = token.bind(null, 'string');

		it('can tokenize a single-quoted empty string', function () {
			expect(chop("''")).toEqual([tokenS('')]);
		});

		it('can tokenize a single-quoted string', function () {
			expect(chop("'asd'")).toEqual([tokenS('asd')]);
		});

		it('throws an exception on a non-terminated single-quoted string', function () {
			expect(chop.bind(null, "'")).toThrow(new Error('String not properly ended'));
		});

		it('throws an exception on a single-quoted string containing new-line', function () {
			expect(chop.bind(null, "'a\nsd'")).toThrow(new Error('String not properly ended'));
		});

		it('can tokenize a double-quoted empty string', function () {
			expect(chop('""')).toEqual([tokenS('')]);
		});

		it('can tokenize a double-quoted string', function () {
			expect(chop('"asd"')).toEqual([tokenS('asd')]);
		});

		it('throws an exception on a non-terminated double-quoted string', function () {
			expect(chop.bind(null, '"')).toThrow(new Error('String not properly ended'));
		});

		it('throws an exception on a double-quoted string containing new-line', function () {
			expect(chop.bind(null, '"a\nsd"')).toThrow(new Error('String not properly ended'));
		});

		describe('single-quoted string escaping', function () {
			it('unescapes \\n', function () {
				var string = "'\\n'";
				expect(chop(string)).toEqual([tokenS(eval(string))]);
			});

			it('unescapes \\\\', function () {
				var string = "'\\\\'";
				expect(chop(string)).toEqual([tokenS(eval(string))]);
			});

			it('unescapes \\\"', function () {
			    var string = "'\\\"'";
				expect(chop(string)).toEqual([tokenS(eval(string))]);
			});

			it('unescapes \\\'', function () {
			    var string = "'\\\''";
				expect(chop(string)).toEqual([tokenS(eval(string))]);
			});

			it('unescapes \"', function () {
			    var string = "'\"'";
				expect(chop(string)).toEqual([tokenS(eval(string))]);
			});

			it('unescapes a complex string', function () {
			    var string = "'a\\ns\\tz\"dfg\"\"\"h'";
				expect(chop(string)).toEqual([tokenS(eval(string))]);
			});
		});

		describe('double-quoted string escaping', function () {
			it('unescapes \\n', function () {
			    var string = '"\\n"';
				expect(chop(string)).toEqual([tokenS(eval(string))]);
			});

			it('unescapes \\\\', function () {
			    var string = '"\\\\"';
				expect(chop(string)).toEqual([tokenS(eval(string))]);
			});

			it('unescapes \\\"', function () {
			    var string = '"\\\""';
				expect(chop(string)).toEqual([tokenS(eval(string))]);
			});

			it('unescapes \\\'', function () {
			    var string = '"\\\'"';
				expect(chop(string)).toEqual([tokenS(eval(string))]);
			});

			it('unescapes \'', function () {
			    var string = '"\'"';
				expect(chop(string)).toEqual([tokenS(eval(string))]);
			});

			it('unescapes a complex string', function () {
			    var string = '"a\\ns\\tz\'dfg\'\'\'h"';
				expect(chop(string)).toEqual([tokenS(eval(string))]);
			});
		});
	});

	describe('prefixes', () => {
		const tokenP = token.bind(null, 'prefix');
		const tokenI = token.bind(null, 'identifier');

		it('can tokenize a prefix', () => {
			expect(chop("#")).toEqual([tokenP('#')]);
		});

		it('can tokenize a prefix before an identifier', () => {
			expect(chop("#asd")).toEqual([tokenP('#'), tokenI('asd')]);
		});

		it('can tokenize multiple prefixes', () => {
			expect(chop("#@@")).toEqual([tokenP('#'), tokenP('@'), tokenP('@')]);
		});
	})
});
