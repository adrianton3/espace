(() => {
	'use strict'

	function raise (coords, message) {
		const exception = new Error(message)
		exception.coords = coords
		throw exception
	}

	function Tokenizer (options) {
		options = options || {}
		const whitespace = !!options.whitespace
		const comments = !!options.comments
		const coords = !!options.coords
		const prefixes = options.prefixes || {}

		const makeToken = coords ?
			(type, value, coords) => ({ type, value, coords }) :
			(type, value) => ({ type, value })

		const escape = {
			'\\': '\\',
			'n': '\n',
			't': '\t',
			"'": "'",
			'"': '"',
		}

		function chopStringSingle (str) {
			const accumulated = []
			str.advance()

			while (true) {
				if (str.current() === '\\') {
					str.advance()
					if (escape[str.current()]) {
						accumulated.push(escape[str.current()])
					}
				} else if (str.current() === "'") {
					str.advance()
					return makeToken('string', accumulated.join(''), str.getCoords())
				} else if (str.current() === '\n' || !str.hasNext()) {
					raise(str.getCoords(), 'String not properly ended')
				} else {
					accumulated.push(str.current())
				}

				str.advance()
			}
		}

		function chopStringDouble (str) {
			const accumulated = []
			str.advance()

			while (true) {
				if (str.current() === '\\') {
					str.advance()
					if (escape[str.current()]) {
						accumulated.push(escape[str.current()])
					}
				} else if (str.current() === '"') {
					str.advance()
					return makeToken('string', accumulated.join(''), str.getCoords())
				} else if (str.current() === '\n' || !str.hasNext()) {
					raise(str.getCoords(), 'String not properly ended')
				} else {
					accumulated.push(str.current())
				}

				str.advance()
			}
		}

		function chopNumber (str) {
			str.setMarker()

			let tmp = str.current()
			while (tmp >= '0' && tmp <= '9') {
				str.advance()
				tmp = str.current()
			}

			if (str.current() === '.') {
				str.advance()
				let tmp = str.current()
				while (tmp >= '0' && tmp <= '9') {
					str.advance()
					tmp = str.current()
				}
			}

			if (!')]} \n\t'.includes(str.current())) {
				raise(
					str.getCoords(),
					`Unexpected character '${str.current()}' after '${str.getMarked()}'`,
				)
			}

			return makeToken('number', Number(str.getMarked()), str.getCoords())
		}

		function chopCommentMulti (str) {
			str.setMarker(2)
			str.advance()
			str.advance()

			while (true) {
				if (str.current() === '-' && str.next() === ';') {
					str.advance()
					str.advance()
					return makeToken('comment', str.getMarked(-2), str.getCoords())
				} else if (str.hasNext()) {
					str.advance()
				} else {
					raise(str.getCoords(), 'Multiline comment not properly terminated')
				}
			}
		}

		function chopCommentSingle (str) {
			str.setMarker(1)
			str.advance()

			while (true) {
				if (str.current() === '\n' || !str.hasNext()) {
					str.advance()
					return makeToken('comment', str.getMarked(), str.getCoords())
				} else {
					str.advance()
				}
			}
		}

		function chopIdentifier (str) {
			str.setMarker()

			let tmp = str.current()
			while (
				tmp > ' ' && tmp <= '~' &&
				tmp !== '(' && tmp !== ')' &&
				tmp !== '[' && tmp !== ']' &&
				tmp !== '{' && tmp !== '}'
			) {
				str.advance()
				tmp = str.current()
			}

			return makeToken('identifier', str.getMarked(), str.getCoords())
		}

		function chopWhitespace (str) {
			const tmp = str.current()
			str.advance()
			return makeToken('whitespace', tmp, str.getCoords())
		}

		return (string) => {
			const str = new espace.IterableString(string)
			const tokens = []

			while (str.hasNext()) {
				const current = str.current()

				// TODO: use a table instead
				if (current === "'") {
					tokens.push(chopStringSingle(str))
				} else if (current === '"') {
					tokens.push(chopStringDouble(str))
				} else if (current === ';') {
					if (str.next() === '-') {
						const tmp = chopCommentMulti(str)

						if (comments) {
							tokens.push(tmp)
						}
					} else {
						const tmp = chopCommentSingle(str)

						if (comments) {
							tokens.push(tmp)
						}
					}
				} else if (current >= '0' && current <= '9') {
					tokens.push(chopNumber(str))
				} else if (current === '(' || current === '[' || current === '{') {
					tokens.push(makeToken('open', current, str.getCoords()))
					str.advance()
				} else if (current === ')' || current === ']' || current === '}') {
					tokens.push(makeToken('closed', current, str.getCoords()))
					str.advance()
				} else if (prefixes.hasOwnProperty(current)) {
					tokens.push(makeToken('prefix', prefixes[current], str.getCoords()))
					str.advance()
				} else if (current > ' ' && current <= '~') {
					tokens.push(chopIdentifier(str))
				} else {
					const tmp = chopWhitespace(str)
					if (whitespace) {
						tokens.push(tmp)
					}
				}
			}

			// tokens.push(tokenV('END', str.getCoords()));

			return tokens
		}
	}

	espace.Tokenizer = Tokenizer
})()
