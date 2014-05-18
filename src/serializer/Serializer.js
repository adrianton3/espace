(function () {
	'use strict';

	var Serializer = {};

	Serializer.serialize = function (expression) {
		switch (expression.token.type) {
			case 'string':
				return '"' + expression.token.value + '"';
			case 'number':
				return expression.token.value;
			case 'alphanum':
				return expression.token.value;
			case '(':
				return '(' +
					expression.tree.map(function (subexpression) {
						return Serializer.serialize(subexpression);
					}).join(' ') +
					')';
		}
	};

	window.espace = window.espace || {};
	window.espace.Serializer = Serializer;
})();