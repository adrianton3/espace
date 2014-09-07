describe('Expander', function () {
	var tokenizer = espace.Tokenizer();

	var parse = function (text) {
		return espace.Parser.parse(tokenizer(text));
	};

	var processForRest = espace.Expander.processForRest;


	describe('extract', function () {
		var extract = espace.Expander.extract;

		it('matches a simple expression', function () {
			var source = parse('(+ a b)');
			var pattern = parse('(+ a b)');
			expect(extract(source, pattern)).toBeTruthy();
		});

		it('rejects a simple expression', function () {
			var source = parse('(+ a b)');
			var pattern = parse('(- a b)');
			expect(extract(source, pattern)).toBeNull();
		});

		it('rejects when trying to match a atom with an expression', function () {
			var source = parse('a');
			var pattern = parse('(+ a b)');
			expect(extract(source, pattern)).toBeNull();
		});

		it('matches a complex expression with one-to-one correspondence', function () {
			var source = parse('(+ a (- b c))');
			var pattern = parse('(+ a (- b c))');
			expect(extract(source, pattern)).toBeTruthy();
		});

		it('matches a complex expression', function () {
			var source = parse('(+ a (- b c))');
			var pattern = parse('(+ a b)');
			expect(extract(source, pattern)).toBeTruthy();
		});

		it('extracts values from a simple expression', function () {
			var source = parse('(+ 123 a)');
			var pattern = parse('(+ x y)');

			var map = extract(source, pattern);
			expect(map).toBeTruthy();
			expect(map.x).toEqual(parse('123'));
			expect(map.y).toEqual(parse('a'));
		});

		it('extracts values from a complex expression with one-to-one correspondence', function () {
			var source = parse('(+ 123 (- a "asd"))');
			var pattern = parse('(+ x (- y z))');

			var map = extract(source, pattern);
			expect(map).toBeTruthy();
			expect(map.x).toEqual(parse('123'));
			expect(map.y).toEqual(parse('a'));
			expect(map.z).toEqual(parse('"asd"'));
		});

		it('extracts values from a complex expression', function () {
			var source = parse('(+ 123 (- a "asd"))');
			var pattern = parse('(+ x y)');

			var map = extract(source, pattern);
			expect(map).toBeTruthy();
			expect(map.x).toEqual(parse('123'));
			expect(map.y).toEqual(parse('(- a "asd")'));
		});

		it('extracts a rest parameter', function () {
			var source = parse('(+ a b c)');
			var pattern = parse('(+ x...)');
			processForRest(pattern);

			var map = extract(source, pattern);
			expect(map).toBeTruthy();
			expect(map['x...']).toEqual([parse('a'), parse('b'), parse('c')]);
		});

		it('extracts a rest parameter when surrounded by other tokens', function () {
			var source = parse('(+ a b c d e)');
			var pattern = parse('(+ x y... z)');
			processForRest(pattern);

			var map = extract(source, pattern);
			expect(map).toBeTruthy();
			expect(map.x).toEqual(parse('a'));
			expect(map['y...']).toEqual([parse('b'), parse('c'), parse('d')]);
			expect(map.z).toEqual(parse('e'));
		});
	});


	describe('deepClone', function () {
		var deepClone = espace.Expander.deepClone;

		it('clones atoms', function () {
			var expression = parse('asd');
			expect(deepClone(expression)).toEqual(expression);

			expression = parse('123');
			expect(deepClone(expression)).toEqual(expression);

			expression = parse('"asd"');
			expect(deepClone(expression)).toEqual(expression);
		});

		it('clones an empty expression', function () {
			var expression = parse('()');
			expect(deepClone(expression)).toEqual(expression);
		});

		it('clones a simple expression', function () {
			var expression = parse('(a)');
			expect(deepClone(expression)).toEqual(expression);
		});

		it('clones a single-level expression', function () {
			var expression = parse('(a b c)');
			expect(deepClone(expression)).toEqual(expression);
		});

		it('clones a multi-level expression', function () {
			var expression = parse('(a (b c) d)');
			expect(deepClone(expression)).toEqual(expression);
		});
	});


	describe('inject', function () {
		var inject = espace.Expander.inject;

		it('injects a variable into a single atom', function () {
			var source = parse('a');
			var map = { a: parse('b') };
			inject(source, map);
			expect(source).toEqual(parse('b'));
		});

		it('injects a variable into a single-level expression', function () {
			var source = parse('(+ a c)');
			var map = { a: parse('b') };
			inject(source, map);
			expect(source).toEqual(parse('(+ b c)'));
		});

		it('injects a variable into a multi-level expression', function () {
			var source = parse('(+ a (- c d) e)');
			var map = { c: parse('b') };
			inject(source, map);
			expect(source).toEqual(parse('(+ a (- b d) e)'));
		});

		it('injects a tree into an expression', function () {
			var source = parse('(+ a e)');
			var map = {
				a: parse('(- b c)'),
				e: parse('(- f g)')
			};
			inject(source, map);
			expect(source).toEqual(parse('(+ (- b c) (- f g))'));
		});

		it('injects a rest term into an expression', function () {
			var source = parse('(+ a z...)');
			var map = {
				'z...': [parse('b'), parse('c')]
			};
			inject(source, map);
			var expected = parse('(+ a b c)');
			expect(source).toEqual(expected);
		});

		it('injects two rest terms into an expression', function () {
			var source = parse('(+ x... y...)');
			var map = {
				'x...': [parse('a'), parse('b')],
				'y...': [parse('c'), parse('d')]
			};
			inject(source, map);
			var expected = parse('(+ a b c d)');
			expect(source).toEqual(expected);
		});
	});


	describe('processForRest', function () {
		var processForRest = function (text) {
			var tree = parse(text);
			return espace.Expander.processForRest(tree);
		};

		var parseAndRest = function (text, before, after, name) {
			var tree = parse(text);
			tree.rest = {
				before: before,
				after: after,
				name: name
			};
			return tree;
		};

		var tokenA = function (value) {
			return {
				token: {
					type: 'alphanum',
					value: value
				}
			};
		};

		var tokenP = function (rest) {
			var tree = {
				token: {
					type: '('
				},
				tree: Array.prototype.slice.call(arguments, 1)
			};
			if (rest) {
				tree.rest = rest;
			}
			return tree;
		};

		it('does not affect expressions that don\'t contain rest parameters', function () {
			var source = '(+ a b c)';
			var tree = processForRest(source);
			expect(tree).toEqual(parse(source));
		});

		it('matches the rest token in a simple expression', function () {
			var source = '(+ a...)';
			var tree = processForRest(source);
			expect(tree).toEqual(parseAndRest(source, 0, 0, 'a...'));
		});

		it('matches the rest token in a simple expression when it is not the first', function () {
			var source = '(+ a b c...)';
			var tree = processForRest(source);
			expect(tree).toEqual(parseAndRest(source, 2, 0, 'c...'));
		});

		it('matches the rest token in a simple expression when it is not the last', function () {
			var source = '(+ a... b c)';
			var tree = processForRest(source);
			expect(tree).toEqual(parseAndRest(source, 0, 2, 'a...'));
		});

		it('matches the rest token in a simple expression when it is not the first nor the last', function () {
			var source = '(+ a b... c d)';
			var tree = processForRest(source);
			expect(tree).toEqual(parseAndRest(source, 1, 2, 'b...'));
		});

		it('matches the rest tokens in a nested expression', function () {
			var source = '(+ a b... (- c... d))';
			var tree = processForRest(source);

			expect(tree).toEqual(tokenP({
				before: 1,
				after: 1,
				name: 'b...'
			},
				tokenA('+'),
				tokenA('a'),
				tokenA('b...'),
				tokenP({
					before: 0,
					after: 1,
					name: 'c...'
				},
					tokenA('-'),
					tokenA('c...'),
					tokenA('d')
				)
			));
		});
	});


	describe('validatePattern', function () {
		var validate = function (source) {
			var tree = parse(source);
			return espace.Expander.validatePattern.bind(null, tree);
		};

		beforeEach(function () {
			jasmine.addMatchers(meta.CustomMatchers);
		});

		it('throws an exception when a pattern expression starts with non-identifiers', function () {
			expect(validate('(123 a b)'))
				.toThrowWithMessage('Tokens of type number are not allowed in patterns');
			expect(validate('("asd" a b)'))
				.toThrowWithMessage('Tokens of type string are not allowed in patterns');
		});

		it('throws an exception when a pattern contains non-identifiers', function () {
			expect(validate('(+ a 123)'))
				.toThrowWithMessage('Tokens of type number are not allowed in patterns');
			expect(validate('(+ a "asd")'))
				.toThrowWithMessage('Tokens of type string are not allowed in patterns');
		});

		it('throws an exception when a pattern contains the same variable twice', function () {
			expect(validate('(+ a a)'))
				.toThrowWithMessage('Variable "a" already used in pattern');
		});

		it('throws an exception when a pattern contains more rest variables on the same level', function () {
			expect(validate('(+ a... (+ b c) d...)'))
				.toThrowWithMessage('Pattern can contain at most one rest variable on a level');
		});
	});


	describe('expand', function () {
		var expand = function (source, pattern, replacement) {
			var sourceTree = parse(source);

			espace.Expander.expand(
				sourceTree,
				parse(pattern),
				parse(replacement)
			);

			return sourceTree;
		};

		it('expands an atom', function () {
			var source = expand('(++ a)', '(++ x)', '(+ x 1)');
			expect(source).toEqual(parse('(+ a 1)'));
		});

		it('rewrites an expression', function () {
			var source = expand('(+ a b c)', '(+ x y z)', '(+ x (+ y z))');
			expect(source).toEqual(parse('(+ a (+ b c))'));
		});

		it('rewrites a complex expression', function () {
			var source = expand('(- m (+ a b c) n)', '(+ x y z)', '(+ x (+ y z))');
			expect(source).toEqual(parse('(- m (+ a (+ b c)) n)'));
		});

		it('rewrites a simple expression with a rest term', function () {
			var source = expand('(+ a b c)', '(+ x...)', '(- x...)');
			expect(source).toEqual(parse('(- a b c)'));
		});

		it('rewrites a longer expression with a rest term', function () {
			var source = expand('(+ a b c d e)', '(+ x y... z)', '(- z y... x)');
			expect(source).toEqual(parse('(- e b c d a)'));
		});

		it('rewrites a nested expression with rest terms', function () {
			var source = expand('(+ a b (+ c d))', '(+ x... (+ y...))', '(+ (+ x...) y...)');
			expect(source).toEqual(parse('(+ (+ a b) c d)'));
		});
	});
});