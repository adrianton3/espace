(function () {
	'use strict';

	function raise(coords, message) {
		var ex = new Error(message);
		ex.coords = coords;
		throw ex;
	}

	function Tokenizer(options) {
		options = options || {};
		var ws = !!options.whitespace;
		var comments = !!options.comments;
		var coords = !!options.coords;

		var token, tokenV;
		if (coords) {
			token = function (type, value, coords) {
				return {
					type: type,
					value: value,
					coords: coords
				};
			};

			tokenV = function (type, coords) {
				return {
					type: type,
					coords: coords
				};
			};
		} else {
			token = function (type, value) {
				return {
					type: type,
					value: value
				};
			};

			tokenV = function (type) {
				return {
					type: type
				};
			};
		}

		var escape = {
			'\\': '\\',
			'n': '\n',
			't': '\t',
			"'": "'",
			'"': '"'
		};

		function stringSingle(str) {
			var accumulated = [];
			str.advance();

			while (true) {
				if (str.current() === '\\') {
					str.advance();
					if (escape[str.current()]) {
						accumulated.push(escape[str.current()]);
					}
				} else if (str.current() === "'") {
					str.advance();
					return token('string', accumulated.join(''), str.getCoords());
				} else if (str.current() === '\n' || !str.hasNext()) {
					raise(str.getCoords(), 'String not properly ended');
				} else {
					accumulated.push(str.current())
				}

				str.advance();
			}
		}

		function stringDouble(str) {
			var accumulated = [];
			str.advance();

			while (true) {
				if (str.current() === '\\') {
					str.advance();
					if (escape[str.current()]) {
						accumulated.push(escape[str.current()]);
					}
				} else if (str.current() === '"') {
					str.advance();
					return token('string', accumulated.join(''), str.getCoords());
				} else if (str.current() === '\n' || !str.hasNext()) {
					raise(str.getCoords(), 'String not properly ended');
				} else {
					accumulated.push(str.current())
				}

				str.advance();
			}
		}

		function number(str) {
			str.setMarker();

			var tmp = str.current();
			while (tmp >= '0' && tmp <= '9') {
				str.advance();
				tmp = str.current();
			}

			if (str.current() == '.') {
				str.advance();
				var tmp = str.current();
				while (tmp >= '0' && tmp <= '9') {
					str.advance();
					tmp = str.current();
				}
			}

			if (') \n\t'.indexOf(str.current()) === -1) {
				raise(str.getCoords(), "Unexpected character '" +
					str.current() + "' after '" +
					str.getMarked() + "'");
	        }

			return token('number', +str.getMarked(), str.getCoords());
		}

		function commentMulti(str) {
			str.setMarker(2);
			str.advance();
			str.advance();

			while (true) {
				if (str.current() === '-' && str.next() === ';') {
					str.advance();
					str.advance();
	                return token('comment', str.getMarked(-2), str.getCoords());
				} else if (str.hasNext()) {
					str.advance();
				} else {
					raise(str.getCoords(), 'Multiline comment not properly terminated');
				}
			}
		}

		function commentSingle(str) {
			str.setMarker(1);
			str.advance();

			while (true) {
				if (str.current() === '\n' || !str.hasNext()) {
					str.advance();
	                return token('comment', str.getMarked(), str.getCoords());
				} else {
					str.advance();
				}
			}
		}

		function identifier(str) {
			str.setMarker();

			var tmp = str.current();
			while (tmp > ' ' && tmp <= '~' && (tmp != '(' && tmp != ')')) {
				str.advance();
				tmp = str.current();
			}

	        return token('identifier', str.getMarked(), str.getCoords());
		}

		function whitespace(str) {
			var tmp = str.current();
			str.advance();
			return token('whitespace', tmp, str.getCoords());
		}

		return function chop(string) {
			var str = new espace.IterableString(string);
			var tokens = [];

			while (str.hasNext()) {
				var current = str.current();

				// TODO: use a table instead
				if (current === "'") {
					tokens.push(stringSingle(str));
				} else if (current === '"') {
					tokens.push(stringDouble(str));
				} else if (current === ';') {
					var next = str.next();

					if (next === '-') {
						var tmp = commentMulti(str);
						if (comments) { tokens.push(tmp); }
					} else {
	                    var tmp = commentSingle(str);
	                    if (comments) { tokens.push(tmp); }
					}
				} else if (current >= '0' && current <= '9') {
					tokens.push(number(str));
				} else if (current === '(') {
					tokens.push(tokenV('(', str.getCoords()));
					str.advance();
				} else if (current === ')') {
					tokens.push(tokenV(')', str.getCoords()));
					str.advance();
				} else if (current > ' ' && current <= '~') {
					tokens.push(identifier(str));
				} else {
					var tmp = whitespace(str);
					if (ws) { tokens.push(tmp); }
				}
			}

			//tokens.push(tokenV('END', str.getCoords()));

			return tokens;
		};
	}

	espace.Tokenizer = Tokenizer;
})();
