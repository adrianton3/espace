(function () {
	'use strict'

	function raise (coords, message) {
		const ex = new Error(message)
		ex.coords = coords
		throw ex
	}

	function Tokenizer (options) {
		options = options || {}
		const ws = !!options.whitespace
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

		function stringSingle (str) {
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

		function stringDouble (str) {
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

		function number (str) {
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
				raise(str.getCoords(), "Unexpected character '" +
					str.current() + "' after '" +
					str.getMarked() + "'")
			}

			return makeToken('number', +str.getMarked(), str.getCoords())
		}

		function commentMulti (str) {
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

		function commentSingle (str) {
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

		function identifier (str) {
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

		function whitespace (str) {
			const tmp = str.current()
			str.advance()
			return makeToken('whitespace', tmp, str.getCoords())
		}

		return function chop (string) {
			const str = new espace.IterableString(string)
			const tokens = []

			while (str.hasNext()) {
				const current = str.current()

				// TODO: use a table instead
				if (current === "'") {
					tokens.push(stringSingle(str))
				} else if (current === '"') {
					tokens.push(stringDouble(str))
				} else if (current === ';') {
					const next = str.next()

					if (next === '-') {
						const tmp = commentMulti(str)
						if (comments) { tokens.push(tmp) }
					} else {
						const tmp = commentSingle(str)
						if (comments) { tokens.push(tmp) }
					}
				} else if (current >= '0' && current <= '9') {
					tokens.push(number(str))
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
					tokens.push(identifier(str))
				} else {
					const tmp = whitespace(str)
					if (ws) { tokens.push(tmp) }
				}
			}

			// tokens.push(tokenV('END', str.getCoords()));

			return tokens
		}
	}

	espace.Tokenizer = Tokenizer
})()
