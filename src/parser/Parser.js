(function () {
    'use strict';

    var Parser = {};

	function raise(token, message) {
		var ex = new Error(message);
		ex.coords = token.coords;
		throw ex;
	}

    Parser.parse = function (tokens) {
		if (!tokens.length) {
			return null;
		}

        var root;
        var stack = [];
        var currentLevel = null;

        var token = tokens[0];
        if (token.type === '(') {
            currentLevel = { token: token, children: [] };
            root = currentLevel;
            stack.push(currentLevel);
        } else if (token.type === ')') {
            raise(token, 'Cannot start with )');
        } else {
            if (tokens.length > 1) {
				raise(token, 'Unexpected token');
            }
            root = { token: token };
            return root;
        }

        for (var i = 1; i < tokens.length; i++) {
            token = tokens[i];

			if (!currentLevel) {
				raise(token, 'Unexpected token');
			}

            if (token.type === '(') {
                var newLevel = { token: token, children: [] };
                currentLevel.children.push(newLevel);
                currentLevel = newLevel;
                stack.push(currentLevel);
            } else if (token.type === ')') {
				stack.pop();
				currentLevel = stack[stack.length - 1];
            } else {
                currentLevel.children.push({ token: token });
            }
        }

		if (stack.length) {
			raise(token, 'Missing )');
		}

        return root;
    };

    window.espace = window.espace || {};
    window.espace.Parser = Parser;
})();