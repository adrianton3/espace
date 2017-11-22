(function () {
	'use strict'

	const Expander = {}

	function extract (source, pattern) {
		const map = {}

		function extract (source, pattern) {
			if (pattern.type === 'list') {
				if (source.type !== 'list' || source.token.value !== pattern.token.value) {
					return false
				}

				// just a precheck before we dive in
				if (pattern.rest) {
					if (source.children.length < pattern.rest.before + 1 + pattern.rest.after) {
						return false
					}
				} else {
					if (source.children.length !== pattern.children.length) {
						return false
					}
				}

				// first symbol must be the same identifier in both cases
				if (source.children[0].token.type !== 'identifier' ||
					source.children[0].token.value !== pattern.children[0].token.value) {
					return false
				}

				// the rest have to match
				if (pattern.rest) {
					for (let i = 1; i <= pattern.rest.before; i++) {
						if (!extract(source.children[i], pattern.children[i])) {
							return false
						}
					}

					map[pattern.rest.name] = source.children.slice(
						1 + pattern.rest.before,
						source.children.length - pattern.rest.after
					)

					for (let i = 0; i < pattern.rest.after; i++) {
						if (!extract(
							source.children[source.children.length - pattern.rest.after + i],
							pattern.children[i + 1 + 1 + pattern.rest.before])
						) {
							return false
						}
					}
				} else {
					for (let i = 1; i < pattern.children.length; i++) {
						if (!extract(source.children[i], pattern.children[i])) {
							return false
						}
					}
				}

				return true
			} else {
				map[pattern.token.value] = source
				return true
			}
		}

		if (extract(source, pattern)) {
			return map
		} else {
			return null
		}
	}

	Expander.extract = extract


	function deepClone (tree) {
		const treeClone = {
			type: tree.type,
			token: {
				type: tree.token.type,
				value: tree.token.value,
			},
		}

		if (tree.type === 'list') {
			treeClone.children = tree.children.map(function (subtree) {
				return deepClone(subtree)
			})
		}

		return treeClone
	}

	Expander.deepClone = deepClone


	function insert (array, start, subArray) {
		const args = [start, 1].concat(subArray)
		Array.prototype.splice.apply(array, args)
		return array
	}

	function isPrefixed (string) {
		return string.length > 1 && string[0] === '_'
	}

	function inject (tree, map, suffixes) {
		const suffixesThisRound = {}

		function inject (tree) {
			if (tree.children.length) {
				const child = tree.children[0]

				if (isPrefixed(child.token.value)) {
					if (!suffixesThisRound[child.token.value]) {
						if (typeof suffixes[child.token.value] !== 'undefined') {
							suffixes[child.token.value]++
						} else {
							suffixes[child.token.value] = 0
						}

						suffixesThisRound[child.token.value] = child.token.value + '_' + suffixes[child.token.value]
					}

					child.token.value = suffixesThisRound[child.token.value]
				}
			}

			for (let i = 1; i < tree.children.length; i++) {
				const child = tree.children[i]

				if (child.token.type === 'identifier') {
					const replaceTree = map[child.token.value]
					if (Array.isArray(replaceTree)) {
						insert(tree.children, i, replaceTree)
						i += replaceTree.length - 1
					} else if (replaceTree) {
						tree.children[i] = replaceTree
					} else if (isPrefixed(child.token.value)) {
						if (!suffixesThisRound[child.token.value]) {
							if (typeof suffixes[child.token.value] !== 'undefined') {
								suffixes[child.token.value]++
							} else {
								suffixes[child.token.value] = 0
							}

							suffixesThisRound[child.token.value] = child.token.value + '_' + suffixes[child.token.value]
						}

						child.token.value = suffixesThisRound[child.token.value]
					}
				} else if (child.type === 'list') {
					inject(child)
				}
			}
		}

		if (tree.token.type === 'identifier') {
			const replaceTree = map[tree.token.value]
			if (replaceTree) {
				tree.token = replaceTree.token
				if (replaceTree.type === 'list') {
					tree.children = replaceTree.children
				}
			}
		} else if (tree.type === 'list') {
			inject(tree)
		}
	}

	Expander.inject = inject


	function isRest (string) {
		return string.length > 3 && string.substr(string.length - 3) === '...'
	}

	function processForRest (tree) {
		function traverse (tree) {
			if (tree.type === 'list') {
				for (let i = 1; i < tree.children.length; i++) {
					const token = tree.children[i].token
					if (token.type === 'identifier' && isRest(token.value)) {
						tree.rest = {
							before: i - 1,
							after: tree.children.length - i - 1,
							name: token.value,
						}
					} else {
						traverse(tree.children[i])
					}
				}
			}
		}

		traverse(tree)
		return tree
	}

	Expander.processForRest = processForRest


	function validatePattern (tree) {
		const set = {}

		function traverse (tree) {
			if (tree.children.length > 0 && tree.children[0].token.type !== 'identifier') {
				throw new Error('Tokens of type ' + tree.children[0].token.type + ' are not allowed in patterns')
			}

			let rest = false
			for (let i = 1; i < tree.children.length; i++) {
				const subTree = tree.children[i]

				if (subTree.token.type === 'identifier') {
					if (isPrefixed(subTree.token.value)) {
						throw new Error('Pattern can not contain variables prefixed by \'_\'')
					}

					if (set[subTree.token.value]) {
						throw new Error('Variable "' + subTree.token.value + '" already used in pattern')
					} else {
						set[subTree.token.value] = true
					}

					if (isRest(subTree.token.value)) {
						if (rest) {
							throw new Error('Pattern can contain at most one rest variable on a level')
						}
						rest = true
					}
				} else if (subTree.type === 'list') {
					traverse(subTree)
				} else {
					throw new Error('Tokens of type ' + subTree.token.type + ' are not allowed in patterns')
				}
			}
		}

		if (tree.type === 'list') {
			traverse(tree)
		} else {
			throw new Error('Pattern must not be an atom')
		}
	}

	Expander.validatePattern = validatePattern


	Expander.expand = function (source, pattern, substitute, suffixes) {
		processForRest(pattern)

		suffixes = suffixes || {}

		function traverse (source) {
			const map = extract(source, pattern)
			if (map) {
				const newSubtree = deepClone(substitute)
				inject(newSubtree, map, suffixes)

				// putting it back together
				source.token = newSubtree.token
				source.children = newSubtree.children
			}

			if (source.type === 'list') {
				source.children.forEach(traverse)
			}
		}

		traverse(source)
	}


	espace.Expander = Expander
})()
