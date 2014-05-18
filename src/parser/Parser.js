(function () {
    'use strict';

    var Parser = {};

    Parser.parse = function (tokens) {
        var root;
        var stack = [];
        var currentLevel = null;

        var token = tokens[0];
        if (token.type === '(') {
            currentLevel = { token: token, tree: [] };
            root = currentLevel;
            stack.push(currentLevel);
        } else if (token.type === ')') {
            var ex = new Error('Cannot start with )');
            ex.coords = token.coords;
            throw ex;
        } else {
            if (tokens.length > 1) {
                var ex = new Error('Unexpected token');
            	ex.coords = token.coords;
            	throw ex;
            }
            root = { token: token };
            return root;
        }

        for (var i = 1; i < tokens.length; i++) {
            token = tokens[i];

            if (token.type === '(') {
                var newLevel = { token: token, tree: [] };
                currentLevel.tree.push(newLevel);
                currentLevel = newLevel;
                stack.push(currentLevel);
            } else if (token.type === ')') {
                stack.pop();
                currentLevel = stack[stack.length - 1];
            } else {
                currentLevel.tree.push({ token: token });
            }
        }

        return root;
    };

    window.espace = window.espace || {};
    window.espace.Parser = Parser;
})();