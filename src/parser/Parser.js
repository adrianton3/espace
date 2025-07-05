(() => {
	'use strict'

	function raise (token, message) {
		const exception = new Error(message)
		exception.coords = token.coords
		throw exception
	}

	function makeList (token) {
		return {
			type: 'list',
			token,
			children: [],
		}
	}

	function makeListPrefix (token, child) {
		return {
			type: 'list',
			token,
			children: [{
				type: 'atom',
				token: {
					type: 'identifier',
					value: token.value,
				},
			}, child],
		}
	}

	function getMatching (open) {
		return open === '(' ? ')'
			: open === '[' ? ']'
			: '}'
	}

	function parse (tokens) {
		let index = 0

		function traverse () {
			const token = tokens[index]
			index++

			if (token.type === 'open') {
				const list = makeList(token)
				const expectedMatching = getMatching(token.value)

				while (true) {
					if (index >= tokens.length) {
						raise(tokens[index - 1], `Expected matching "${expectedMatching}" before end of input`)
					}

					if (tokens[index].type === 'closed') {
						if (tokens[index].value === expectedMatching) {
							index++
							break
						} else {
							raise(tokens[index], `Expected matching "${getMatching(token.value)}"`)
						}
					}

					list.children.push(traverse())
				}

				return list
			}

			if (token.type === 'prefix') {
				if (index >= tokens.length) {
					raise(tokens[index - 1], `Unexpected end of input`)
				}

				return makeListPrefix(token, traverse())
			}

			return {
				type: 'atom',
				token,
			}
		}

		const top = []

		while (index < tokens.length) {
			const token = tokens[index]

			if (token.type === 'closed') {
				raise(token, `Unexpected "${token.value}"`)
			}

			top.push(traverse())
		}

		return top
	}

	espace.Parser = {
		parse,
	}
})()
