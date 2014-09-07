(function () {
	'use strict';

	var SAMPLE_TEXT = {
		source: [
			'(+ a b c)'
		].join('\n'),
		macros: [
			'((+ x y z)',
			' (+ x (+ y z)))'
		].join('\n')
	};


	// setting up the editors
	var sourceEditor = ace.edit('source-editor');
	sourceEditor.setTheme('ace/theme/monokai');
	sourceEditor.setFontSize(18);
	sourceEditor.setValue(SAMPLE_TEXT.source, 1);
	sourceEditor.on('input', onInput);

	var macrosEditor = ace.edit('macros-editor');
	macrosEditor.setTheme('ace/theme/monokai');
	macrosEditor.setFontSize(18);
	macrosEditor.setValue(SAMPLE_TEXT.macros, 1);
	macrosEditor.on('input', onInput);

	var outputEditor = ace.edit('output-editor');
	outputEditor.setTheme('ace/theme/monokai');
	outputEditor.getSession().setUseWrapMode(true);
	outputEditor.setReadOnly(true);
	outputEditor.setFontSize(18);


	// getting a tokenizer
	var tokenizer = espace.Tokenizer();

	function onInput() {
		var sourceText = sourceEditor.getValue();
		var macrosText = macrosEditor.getValue();

		var parse = function (text) {
			return espace.Parser.parse(tokenizer(text));
		};

		var serialize = espace.Serializer.serialize;

		try {
			var sourceTree = parse(sourceText);

			var macrosTree = parse(macrosText);
			if (macrosTree.token.type !== '(' || macrosTree.tree.length !== 2) {
				throw new Error('Expected a macro definition');
			}

			espace.Expander.validatePattern(macrosTree.tree[0]);

			espace.Expander.expand(
				sourceTree,
				macrosTree.tree[0],
				macrosTree.tree[1]
			);

			outputEditor.setValue(serialize(sourceTree), 1);
		} catch (ex) {
			var exceptionObject = {
				message: ex.message
			};

			outputEditor.setValue(JSON.stringify(exceptionObject, undefined, 2), 1);
		}
	}
})();