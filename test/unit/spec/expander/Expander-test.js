'use strict'

describe('Expander', () => {
	const parse = (text) =>
		espace.Parser.parse(espace.Tokenizer.tokenize(text))


	describe('extract', () => {
		const {
			extract,
			processForRest,
		} = espace.Expander

		it('matches a simple expression', () => {
			const source = parse('(+ a b)')
			const pattern = parse('(+ a b)')
			expect(extract(source, pattern)).toBeTruthy()
		})

		it('rejects a simple expression', () => {
			const source = parse('(+ a b)')
			const pattern = parse('(- a b)')
			expect(extract(source, pattern)).toBeNull()
		})

		it('rejects an expression with different parens', () => {
			const source = parse('(+ a b)')
			const pattern = parse('[+ a b]')
			expect(extract(source, pattern)).toBeNull()
		})

		it('rejects when trying to match a atom with an expression', () => {
			const source = parse('a')
			const pattern = parse('(+ a b)')
			expect(extract(source, pattern)).toBeNull()
		})

		it('matches a complex expression with one-to-one correspondence', () => {
			const source = parse('(+ a (- b c))')
			const pattern = parse('(+ a (- b c))')
			expect(extract(source, pattern)).toBeTruthy()
		})

		it('matches a complex expression', () => {
			const source = parse('(+ a (- b c))')
			const pattern = parse('(+ a b)')
			expect(extract(source, pattern)).toBeTruthy()
		})

		it('matches a complex expression with multiple paren types', () => {
			const source = parse('[+ a {- b c}]')
			const pattern = parse('[+ a b]')
			expect(extract(source, pattern)).toBeTruthy()
		})

		it('extracts values from a simple expression', () => {
			const source = parse('(+ 123 a)')
			const pattern = parse('(+ x y)')

			const map = extract(source, pattern)
			expect(map).toBeTruthy()
			expect(map.x).toEqual(parse('123'))
			expect(map.y).toEqual(parse('a'))
		})

		it('extracts values from a complex expression with one-to-one correspondence', () => {
			const source = parse('(+ 123 (- a "asd"))')
			const pattern = parse('(+ x (- y z))')

			const map = extract(source, pattern)
			expect(map).toBeTruthy()
			expect(map.x).toEqual(parse('123'))
			expect(map.y).toEqual(parse('a'))
			expect(map.z).toEqual(parse('"asd"'))
		})

		it('extracts values from a complex expression', () => {
			const source = parse('(+ 123 (- a "asd"))')
			const pattern = parse('(+ x y)')

			const map = extract(source, pattern)
			expect(map).toBeTruthy()
			expect(map.x).toEqual(parse('123'))
			expect(map.y).toEqual(parse('(- a "asd")'))
		})

		it('extracts a rest parameter', () => {
			const source = parse('(+ a b c)')
			const pattern = parse('(+ x...)')
			processForRest(pattern)

			const map = extract(source, pattern)
			expect(map).toBeTruthy()
			expect(map['x...']).toEqual([parse('a'), parse('b'), parse('c')])
		})

		it('extracts a rest parameter when surrounded by other tokens', () => {
			const source = parse('(+ a b c d e)')
			const pattern = parse('(+ x y... z)')
			processForRest(pattern)

			const map = extract(source, pattern)
			expect(map).toBeTruthy()
			expect(map.x).toEqual(parse('a'))
			expect(map['y...']).toEqual([parse('b'), parse('c'), parse('d')])
			expect(map.z).toEqual(parse('e'))
		})
	})


	describe('deepClone', () => {
		const { deepClone } = espace.Expander

		it('clones atoms', () => {
			let expression = parse('asd')
			expect(deepClone(expression)).toEqual(expression)

			expression = parse('123')
			expect(deepClone(expression)).toEqual(expression)

			expression = parse('"asd"')
			expect(deepClone(expression)).toEqual(expression)
		})

		it('clones an empty expression', () => {
			const expression = parse('()')
			expect(deepClone(expression)).toEqual(expression)
		})

		it('clones a simple expression', () => {
			const expression = parse('(a)')
			expect(deepClone(expression)).toEqual(expression)
		})

		it('clones a single-level expression', () => {
			const expression = parse('(a b c)')
			expect(deepClone(expression)).toEqual(expression)
		})

		it('clones a multi-level expression', () => {
			const expression = parse('(a (b c) d)')
			expect(deepClone(expression)).toEqual(expression)
		})

		it('clones a multi-level expression with multiple paren types', () => {
			const expression = parse('(a [b {c}] d)')
			expect(deepClone(expression)).toEqual(expression)
		})
	})


	describe('inject', () => {
		function inject (source, map, suffixes) {
			espace.Expander.inject(source, map, suffixes || {})
		}

		it('injects a variable into a single atom', () => {
			const source = parse('a')
			const map = { a: parse('b') }
			inject(source, map)
			expect(source).toEqual(parse('b'))
		})

		it('injects a variable into a single-level expression', () => {
			const source = parse('(+ a c)')
			const map = { a: parse('b') }
			inject(source, map)
			expect(source).toEqual(parse('(+ b c)'))
		})

		it('injects a variable into a multi-level expression', () => {
			const source = parse('(+ a (- c d) e)')
			const map = { c: parse('b') }
			inject(source, map)
			expect(source).toEqual(parse('(+ a (- b d) e)'))
		})

		it('injects a tree into an expression', () => {
			const source = parse('(+ a e)')
			const map = {
				a: parse('(- b c)'),
				e: parse('(- f g)'),
			}
			inject(source, map)
			expect(source).toEqual(parse('(+ (- b c) (- f g))'))
		})

		it('injects a rest term into an expression', () => {
			const source = parse('(+ a z...)')
			const map = {
				'z...': [parse('b'), parse('c')],
			}
			inject(source, map)
			const expected = parse('(+ a b c)')
			expect(source).toEqual(expected)
		})

		it('injects two rest terms into an expression', () => {
			const source = parse('(+ x... y...)')
			const map = {
				'x...': [parse('a'), parse('b')],
				'y...': [parse('c'), parse('d')],
			}
			inject(source, map)
			const expected = parse('(+ a b c d)')
			expect(source).toEqual(expected)
		})

		it('generates a unique name for a prefixed identifier', () => {
			const source = parse('(+ _a)')
			const map = {}
			const suffixes = {}
			inject(source, map, suffixes)
			const expected = parse('(+ _a_0)')
			expect(source).toEqual(expected)
		})

		it('generates a unique name for a prefixed identifier and uses it consistently', () => {
			const source = parse('(+ _a _a)')
			const map = {}
			const suffixes = {}
			inject(source, map, suffixes)
			const expected = parse('(+ _a_0 _a_0)')
			expect(source).toEqual(expected)
		})
	})


	describe('processForRest', () => {
		function processForRest (text) {
			const tree = parse(text)
			espace.Expander.processForRest(tree)
			return tree
		}

		function parseAndRest (text, before, after, name) {
			const tree = parse(text)
			tree.rest = {
				before,
				after,
				name,
			}
			return tree
		}

		function makeAtom (value) {
			return {
				type: 'atom',
				token: {
					type: 'identifier',
					value,
				},
			}
		}

		function makeList (rest, ...children) {
			return {
				type: 'list',
				token: {
					type: 'open',
					value: '(',
				},
				children,
				rest,
			}
		}

		it('does not affect expressions that don\'t contain rest parameters', () => {
			const source = '(+ a b c)'
			const tree = processForRest(source)
			expect(tree).toEqual(parse(source))
		})

		it('matches the rest token in a simple expression', () => {
			const source = '(+ a...)'
			const tree = processForRest(source)
			expect(tree).toEqual(parseAndRest(source, 0, 0, 'a...'))
		})

		it('matches the rest token in a simple expression when it is not the first', () => {
			const source = '(+ a b c...)'
			const tree = processForRest(source)
			expect(tree).toEqual(parseAndRest(source, 2, 0, 'c...'))
		})

		it('matches the rest token in a simple expression when it is not the last', () => {
			const source = '(+ a... b c)'
			const tree = processForRest(source)
			expect(tree).toEqual(parseAndRest(source, 0, 2, 'a...'))
		})

		it('matches the rest token in a simple expression when it is not the first nor the last', () => {
			const source = '(+ a b... c d)'
			const tree = processForRest(source)
			expect(tree).toEqual(parseAndRest(source, 1, 2, 'b...'))
		})

		it('matches the rest tokens in a nested expression', () => {
			const source = '(+ a b... (- c... d))'
			const tree = processForRest(source)

			expect(tree).toEqual(
				makeList({ before: 1, after: 1, name: 'b...' },
					makeAtom('+'),
					makeAtom('a'),
					makeAtom('b...'),
					makeList({ before: 0, after: 1, name: 'c...' },
						makeAtom('-'),
						makeAtom('c...'),
						makeAtom('d'),
					)
				)
			)
		})
	})


	describe('validatePattern', () => {
		function validate (source) {
			const tree = parse(source)
			return espace.Expander.validatePattern.bind(null, tree)
		}

		beforeEach(() => {
			jasmine.addMatchers(meta.CustomMatchers)
		})

		it('throws an exception when a pattern expression starts with non-identifiers', () => {
			expect(validate('(123 a b)'))
				.toThrowWithMessage('Tokens of type number are not allowed in patterns')
			expect(validate('("asd" a b)'))
				.toThrowWithMessage('Tokens of type string are not allowed in patterns')
		})

		it('throws an exception when a pattern contains non-identifiers', () => {
			expect(validate('(+ a 123)'))
				.toThrowWithMessage('Tokens of type number are not allowed in patterns')
			expect(validate('(+ a "asd")'))
				.toThrowWithMessage('Tokens of type string are not allowed in patterns')
		})

		it('throws an exception when a pattern contains the same variable twice', () => {
			expect(validate('(+ a a)'))
				.toThrowWithMessage('Variable "a" already used in pattern')
		})

		it('throws an exception when a pattern contains more rest variables on the same level', () => {
			expect(validate('(+ a... (+ b c) d...)'))
				.toThrowWithMessage('Pattern can contain at most one rest variable on a level')
		})

		it('throws an exception when a pattern containes a prefixed variable', () => {
			expect(validate('(+ a b _c)'))
				.toThrowWithMessage('Pattern can not contain variables prefixed by \'_\'')
		})
	})


	describe('expand', () => {
		const expand = function (source, pattern, replacement) {
			const sourceTree = parse(source)

			espace.Expander.expand(
				sourceTree,
				parse(pattern),
				parse(replacement)
			)

			return sourceTree
		}

		it('expands an atom', () => {
			const source = expand('(++ a)', '(++ x)', '(+ x 1)')
			expect(source).toEqual(parse('(+ a 1)'))
		})

		it('rewrites an expression', () => {
			const source = expand('(+ a b c)', '(+ x y z)', '(+ x (+ y z))')
			expect(source).toEqual(parse('(+ a (+ b c))'))
		})

		it('rewrites a complex expression', () => {
			const source = expand('(- m (+ a b c) n)', '(+ x y z)', '(+ x (+ y z))')
			expect(source).toEqual(parse('(- m (+ a (+ b c)) n)'))
		})

		it('rewrites a simple expression with a rest term', () => {
			const source = expand('(+ a b c)', '(+ x...)', '(- x...)')
			expect(source).toEqual(parse('(- a b c)'))
		})

		it('rewrites a longer expression with a rest term', () => {
			const source = expand('(+ a b c d e)', '(+ x y... z)', '(- z y... x)')
			expect(source).toEqual(parse('(- e b c d a)'))
		})

		it('rewrites a nested expression with rest terms', () => {
			const source = expand('(+ a b (+ c d))', '(+ x... (+ y...))', '(+ (+ x...) y...)')
			expect(source).toEqual(parse('(+ (+ a b) c d)'))
		})

		it('generates a unique name for a prefixed identifier', () => {
			const source = expand('(+ a b)', '(+ x y)', '(+ x _z)')
			expect(source).toEqual(parse('(+ a _z_0)'))
		})

		it('generates a unique name for a prefixed identifier and uses it consistently', () => {
			const source = expand('(+ a b)', '(+ x y)', '(+ _z _z)')
			expect(source).toEqual(parse('(+ _z_0 _z_0)'))
		})

		it('generates a unique name for a prefixed identifier in different matches', () => {
			const source = expand('(- (+ a b) (+ c d))', '(+ x y)', '(+ x _z)')
			expect(source).toEqual(parse('(- (+ a _z_0) (+ c _z_1))'))
		})

		it('generates a unique name for a prefixed identifier even if it\'s the first child', () => {
			const source = expand('(swap a b)', '(swap x y)', '(let (_tmp x) (set! x y) (set! y _tmp))')
			expect(source).toEqual(parse('(let (_tmp_0 a) (set! a b) (set! b _tmp_0))'))
		})
	})
})
