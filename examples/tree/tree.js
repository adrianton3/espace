(function () {
	'use strict';

	var SAMPLE_TEXT = [
		'(fun double (n)',
		' (* n 2))'
	].join('\n');


	// setting up the editors
	var inputEditor = ace.edit('input-editor');
	inputEditor.setTheme('ace/theme/monokai');
	inputEditor.setFontSize(18);
	inputEditor.setValue(SAMPLE_TEXT, 1);
	inputEditor.on('input', onInput);

	var outputEditor = ace.edit('output-editor');
	outputEditor.setTheme('ace/theme/monokai');
	outputEditor.getSession().setMode('ace/mode/javascript');
	outputEditor.getSession().setUseWrapMode(true);
	outputEditor.setReadOnly(true);
	outputEditor.setFontSize(18);


	// getting a tokenizer
	var tokenizer = espace.Tokenizer({ coords: true });

	function onInput() {
		var inputText = inputEditor.getValue();
		try {
			var tokens = tokenizer(inputText);
			var tree = espace.Parser.parse(tokens);

			outputEditor.setValue(JSON.stringify(tree, undefined, 2), 1);
		} catch (ex) {
			var exceptionObject = {
				message: ex.message,
				coords: ex.coords
			};

			outputEditor.setValue(JSON.stringify(exceptionObject, undefined, 2), 1);
		}
	}
})();