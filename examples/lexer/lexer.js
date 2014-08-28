(function () {
	'use strict';

	var SAMPLE_TEXT = [
		'() 123',
		'asd a-s-d',
		'\'asd\' "asd"',
		'\'\\\'\' \'"\'',
		'"\\"" "\'"'
	].join('\n');

	// setting up the editors
	var inputEditor = ace.edit('input-editor');
	inputEditor.setTheme('ace/theme/monokai');
	inputEditor.setFontSize(18);
	inputEditor.setValue(SAMPLE_TEXT, 1);
	inputEditor.on('input', onInput);

	var outputEditor = ace.edit('output-editor');
	outputEditor.setTheme('ace/theme/monokai');
	outputEditor.getSession().setUseWrapMode(true);
	outputEditor.setReadOnly(true);
	outputEditor.setFontSize(18);


	// defining how tokens should be stringified
	var printer = {
		'alphanum': function (token) {
			return 'alphanum:' + token.value;
		},
		'number': function (token) {
			return token.value;
		},
		'string': function (token) {
			return '"' + token.value + '"';
		},
		'(': function (token) {
			return '(';
		},
		')': function (token) {
			return ')';
		}
	};


	// getting a tokenizer
	var tokenizer = espace.Tokenizer();

	function onInput() {
		var inputText = inputEditor.getValue();
		try {
			var tokens = tokenizer(inputText);

			var stringedTokens = tokens.map(function (token) {
				return printer[token.type](token);
			}).join(', ');

			outputEditor.setValue(stringedTokens, 1);
		} catch (ex) {
			outputEditor.setValue(
				ex.message + '\nLine: ' + ex.coords.line + ' Column: ' + ex.coords.column,
				1
			);
		}
	}
})();