import { tokenize } from '../../../src/tokenizer.mjs'
import { parse } from '../../../src/parser.mjs'
import * as Ex from '../../../src/expander.mjs'

import { toThrowWithMessage } from '../custom-matchers.mjs'


describe('Expander', () => {
	const getTree = (text) => parse(tokenize(text))[0]

	describe('extract', () => {
		it('matches a simple expression', () => {
			const source = getTree('(+ a b)')
			const pattern = getTree('(+ a b)')
			expect(Ex.extract(source, pattern)).toBeTruthy()
		})

		it('rejects a simple expression', () => {
			const source = getTree('(+ a b)')
			const pattern = getTree('(- a b)')
			expect(Ex.extract(source, pattern)).toBeNull()
		})

		it('rejects an expression with different parens', () => {
			const source = getTree('(+ a b)')
			const pattern = getTree('[+ a b]')
			expect(Ex.extract(source, pattern)).toBeNull()
		})

		it('rejects when trying to match a atom with an expression', () => {
			const source = getTree('a')
			const pattern = getTree('(+ a b)')
			expect(Ex.extract(source, pattern)).toBeNull()
		})

		it('matches a complex expression with one-to-one correspondence', () => {
			const source = getTree('(+ a (- b c))')
			const pattern = getTree('(+ a (- b c))')
			expect(Ex.extract(source, pattern)).toBeTruthy()
		})

		it('matches a complex expression', () => {
			const source = getTree('(+ a (- b c))')
			const pattern = getTree('(+ a b)')
			expect(Ex.extract(source, pattern)).toBeTruthy()
		})

		it('matches a complex expression with multiple paren types', () => {
			const source = getTree('[+ a {- b c}]')
			const pattern = getTree('[+ a b]')
			expect(Ex.extract(source, pattern)).toBeTruthy()
		})

		it('extracts values from a simple expression', () => {
			const source = getTree('(+ 123 a)')
			const pattern = getTree('(+ x y)')

			const map = Ex.extract(source, pattern)
			expect(map).toBeTruthy()
			expect(map.x).toEqual(getTree('123'))
			expect(map.y).toEqual(getTree('a'))
		})

		it('extracts values from a complex expression with one-to-one correspondence', () => {
			const source = getTree('(+ 123 (- a "asd"))')
			const pattern = getTree('(+ x (- y z))')

			const map = Ex.extract(source, pattern)
			expect(map).toBeTruthy()
			expect(map.x).toEqual(getTree('123'))
			expect(map.y).toEqual(getTree('a'))
			expect(map.z).toEqual(getTree('"asd"'))
		})

		it('extracts values from a complex expression', () => {
			const source = getTree('(+ 123 (- a "asd"))')
			const pattern = getTree('(+ x y)')

			const map = Ex.extract(source, pattern)
			expect(map).toBeTruthy()
			expect(map.x).toEqual(getTree('123'))
			expect(map.y).toEqual(getTree('(- a "asd")'))
		})

		it('extracts a rest parameter', () => {
			const source = getTree('(+ a b c)')
			const pattern = getTree('(+ x...)')
			Ex.processForRest(pattern)

			const map = Ex.extract(source, pattern)
			expect(map).toBeTruthy()
			expect(map['x...']).toEqual([getTree('a'), getTree('b'), getTree('c')])
		})

		it('extracts a rest parameter when surrounded by other tokens', () => {
			const source = getTree('(+ a b c d e)')
			const pattern = getTree('(+ x y... z)')
			Ex.processForRest(pattern)

			const map = Ex.extract(source, pattern)
			expect(map).toBeTruthy()
			expect(map.x).toEqual(getTree('a'))
			expect(map['y...']).toEqual([getTree('b'), getTree('c'), getTree('d')])
			expect(map.z).toEqual(getTree('e'))
		})
	})


	describe('deepClone', () => {
		it('clones atoms', () => {
			let expression = getTree('asd')
			expect(Ex.deepClone(expression)).toEqual(expression)

			expression = getTree('123')
			expect(Ex.deepClone(expression)).toEqual(expression)

			expression = getTree('"asd"')
			expect(Ex.deepClone(expression)).toEqual(expression)
		})

		it('clones an empty expression', () => {
			const expression = getTree('()')
			expect(Ex.deepClone(expression)).toEqual(expression)
		})

		it('clones a simple expression', () => {
			const expression = getTree('(a)')
			expect(Ex.deepClone(expression)).toEqual(expression)
		})

		it('clones a single-level expression', () => {
			const expression = getTree('(a b c)')
			expect(Ex.deepClone(expression)).toEqual(expression)
		})

		it('clones a multi-level expression', () => {
			const expression = getTree('(a (b c) d)')
			expect(Ex.deepClone(expression)).toEqual(expression)
		})

		it('clones a multi-level expression with multiple paren types', () => {
			const expression = getTree('(a [b {c}] d)')
			expect(Ex.deepClone(expression)).toEqual(expression)
		})
	})


	describe('inject', () => {
		it('injects a variable into a single atom', () => {
			const source = getTree('a')
			const map = { a: getTree('b') }
			Ex.inject(source, map, {})
			expect(source).toEqual(getTree('b'))
		})

		it('injects a variable into a single-level expression', () => {
			const source = getTree('(+ a c)')
			const map = { a: getTree('b') }
			Ex.inject(source, map, {})
			expect(source).toEqual(getTree('(+ b c)'))
		})

		it('injects a variable into a multi-level expression', () => {
			const source = getTree('(+ a (- c d) e)')
			const map = { c: getTree('b') }
			Ex.inject(source, map, {})
			expect(source).toEqual(getTree('(+ a (- b d) e)'))
		})

		it('injects a tree into an expression', () => {
			const source = getTree('(+ a e)')
			const map = {
				a: getTree('(- b c)'),
				e: getTree('(- f g)'),
			}
			Ex.inject(source, map, {})
			expect(source).toEqual(getTree('(+ (- b c) (- f g))'))
		})

		it('injects a rest term into an expression', () => {
			const source = getTree('(+ a z...)')
			const map = {
				'z...': [getTree('b'), getTree('c')],
			}
			Ex.inject(source, map, {})
			const expected = getTree('(+ a b c)')
			expect(source).toEqual(expected)
		})

		it('injects two rest terms into an expression', () => {
			const source = getTree('(+ x... y...)')
			const map = {
				'x...': [getTree('a'), getTree('b')],
				'y...': [getTree('c'), getTree('d')],
			}
			Ex.inject(source, map, {})
			const expected = getTree('(+ a b c d)')
			expect(source).toEqual(expected)
		})

		it('generates a unique name for a prefixed identifier', () => {
			const source = getTree('(+ _a)')
			const map = {}
			const suffixes = {}
			Ex.inject(source, map, suffixes)
			const expected = getTree('(+ _a_0)')
			expect(source).toEqual(expected)
		})

		it('generates a unique name for a prefixed identifier and uses it consistently', () => {
			const source = getTree('(+ _a _a)')
			const map = {}
			const suffixes = {}
			Ex.inject(source, map, suffixes)
			const expected = getTree('(+ _a_0 _a_0)')
			expect(source).toEqual(expected)
		})
	})


	describe('processForRest', () => {
		function processForRest (text) {
			const tree = getTree(text)
			Ex.processForRest(tree)
			return tree
		}

		function parseAndRest (text, before, after, name) {
			const tree = getTree(text)
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
			expect(tree).toEqual(getTree(source))
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
			const tree = getTree(source)
			return Ex.validatePattern.bind(null, tree)
		}

		beforeEach(() => {
			jasmine.addMatchers({ toThrowWithMessage })
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
			const sourceTree = getTree(source)

			Ex.expand(
				sourceTree,
				getTree(pattern),
				getTree(replacement)
			)

			return sourceTree
		}

		it('expands an atom', () => {
			const source = expand('(++ a)', '(++ x)', '(+ x 1)')
			expect(source).toEqual(getTree('(+ a 1)'))
		})

		it('rewrites an expression', () => {
			const source = expand('(+ a b c)', '(+ x y z)', '(+ x (+ y z))')
			expect(source).toEqual(getTree('(+ a (+ b c))'))
		})

		it('rewrites a complex expression', () => {
			const source = expand('(- m (+ a b c) n)', '(+ x y z)', '(+ x (+ y z))')
			expect(source).toEqual(getTree('(- m (+ a (+ b c)) n)'))
		})

		it('rewrites a simple expression with a rest term', () => {
			const source = expand('(+ a b c)', '(+ x...)', '(- x...)')
			expect(source).toEqual(getTree('(- a b c)'))
		})

		it('rewrites a longer expression with a rest term', () => {
			const source = expand('(+ a b c d e)', '(+ x y... z)', '(- z y... x)')
			expect(source).toEqual(getTree('(- e b c d a)'))
		})

		it('rewrites a nested expression with rest terms', () => {
			const source = expand('(+ a b (+ c d))', '(+ x... (+ y...))', '(+ (+ x...) y...)')
			expect(source).toEqual(getTree('(+ (+ a b) c d)'))
		})

		it('generates a unique name for a prefixed identifier', () => {
			const source = expand('(+ a b)', '(+ x y)', '(+ x _z)')
			expect(source).toEqual(getTree('(+ a _z_0)'))
		})

		it('generates a unique name for a prefixed identifier and uses it consistently', () => {
			const source = expand('(+ a b)', '(+ x y)', '(+ _z _z)')
			expect(source).toEqual(getTree('(+ _z_0 _z_0)'))
		})

		it('generates a unique name for a prefixed identifier in different matches', () => {
			const source = expand('(- (+ a b) (+ c d))', '(+ x y)', '(+ x _z)')
			expect(source).toEqual(getTree('(- (+ a _z_0) (+ c _z_1))'))
		})

		it('generates a unique name for a prefixed identifier even if it\'s the first child', () => {
			const source = expand('(swap a b)', '(swap x y)', '(let (_tmp x) (set! x y) (set! y _tmp))')
			expect(source).toEqual(getTree('(let (_tmp_0 a) (set! a b) (set! b _tmp_0))'))
		})
	})
})
