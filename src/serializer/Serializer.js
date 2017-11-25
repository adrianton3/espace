(() => {
	'use strict'

	function serialize (expression) {
		if (!expression) {
			return ''
		}

		if (expression.type === 'list') {
			if (expression.token.type === 'prefix') {
				return `${expression.token.value}${serialize(expression.children[0])}`
			} else {
				const childrenString = expression.children.map(serialize).join(' ')

				return expression.token.value === '(' ? `(${childrenString})`
					: expression.token.value === '[' ? `[${childrenString}]`
					: `{${childrenString}}`
			}
		}

		switch (expression.token.type) {
		case 'string':
			return `"${expression.token.value}"`
		case 'number':
			return '' + expression.token.value
		case 'identifier':
			return expression.token.value
		}
	}

	espace.Serializer = {
		serialize
	}
})()
