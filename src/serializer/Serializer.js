(function () {
	'use strict';

	var Serializer = {};

	Serializer.serialize = function (expression) {
		if (!expression) {
			return '';
		}

		switch (expression.token.type) {
			case 'string':
				return '"' + expression.token.value + '"';
			case 'number':
				return '' + expression.token.value;
			case 'identifier':
				return expression.token.value;
			case '(':
				return '(' +
					expression.children.map(function (subexpression) {
						return Serializer.serialize(subexpression);
					}).join(' ') +
					')';
		}
	};

	espace.Serializer = Serializer;
})();