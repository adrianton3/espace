(function () {
	'use strict'

	const Parser = {}

	function raise (token, message) {
		const ex = new Error(message)
		ex.coords = token.coords
		throw ex
	}

	function makeList (token) {
		if (token.type === 'open') {
			return {
				type: 'list',
				token,
				children: [],
			}
		}

		return {
			type: 'list',
			token,
			children: [{
				type: 'atom',
				token: {
					type: 'identifier',
					value: token.value,
				},
			}],
		}
	}

	Parser.parse = function (tokens) {
		if (!tokens.length) {
			return null
		}

		let root
		const stack = []
		let currentLevel = null

		let token = tokens[0]
		if (token.type === 'open' || token.type === 'prefix') {
			currentLevel = makeList(token)
			root = currentLevel
			stack.push(currentLevel)
		} else if (token.type === 'closed') {
			raise(token, 'Cannot start with )')
		} else {
			if (tokens.length > 1) {
				raise(token, 'Unexpected token')
			}

			return { type: 'atom', token }
		}

		for (let i = 1; i < tokens.length; i++) {
			token = tokens[i]

			if (!currentLevel) {
				raise(token, 'Unexpected token')
			}

			if (token.type === 'open' || token.type === 'prefix') {
				const newLevel = makeList(token)
				currentLevel.children.push(newLevel)
				currentLevel = newLevel
				stack.push(currentLevel)
			} else {
				if (token.type === 'closed') {
					stack.pop()
					currentLevel = stack[stack.length - 1]
				} else {
					currentLevel.children.push({
						type: 'atom',
						token,
					})
				}

				while (currentLevel && currentLevel.token.type === 'prefix') {
					stack.pop()
					currentLevel = stack[stack.length - 1]
				}
			}
		}

		if (stack.length) {
			raise(token, 'Missing )')
		}

		return root
	}

	espace.Parser = Parser
})()
