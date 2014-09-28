(function () {
	'use strict';

	var SAMPLE_TEXTS = {
		simple: {
			source: [
				'(+ a b c)'
			].join('\n'),
			macros: [
				'(syntax-rule',
				' (+ x y z)',
				' (+ x (+ y z)))'
			].join('\n')
		},
		nested: {
			source: [
				'(- (- a b))'
			].join('\n'),
			macros: [
				'(syntax-rule',
				' (- (- x y))',
				' (- y x))'
			].join('\n')
		},
		rest1: {
			source: [
				'(tail (list a b c d e))'
			].join('\n'),
			macros: [
				'(syntax-rule',
				' (tail (list x y...))',
				' (list y...))'
			].join('\n')
		},
		rest2: {
			source: [
				'(init (list a b c d e))'
			].join('\n'),
			macros: [
				'(syntax-rule',
				' (init (list x... y))',
				' (list x...))'
			].join('\n')
		},
		hygiene: {
			source: [
				'(swap a b)'
			].join('\n'),
			macros: [
				'(syntax-rule',
				' (swap x y)',
				' (let (_tmp x)',
				'  (set! x y)',
				'  (set! y _tmp)))'
			].join('\n')
		}
	};

	var sourceEditor, macrosEditor, outputEditor;

	function setupEditors() {
		sourceEditor = ace.edit('source-editor');
		sourceEditor.setTheme('ace/theme/monokai');
		sourceEditor.setFontSize(18);
		sourceEditor.setValue(SAMPLE_TEXTS.simple.source, 1);
		sourceEditor.on('input', onInput);

		macrosEditor = ace.edit('macros-editor');
		macrosEditor.setTheme('ace/theme/monokai');
		macrosEditor.setFontSize(18);
		macrosEditor.setValue(SAMPLE_TEXTS.simple.macros, 1);
		macrosEditor.on('input', onInput);

		outputEditor = ace.edit('output-editor');
		outputEditor.setTheme('ace/theme/monokai');
		outputEditor.getSession().setUseWrapMode(true);
		outputEditor.setReadOnly(true);
		outputEditor.setFontSize(18);
	}

	function setupLinks() {
		var selection = document.getElementsByClassName('link');
		var elements = Array.prototype.slice.call(selection, 0);

		var onClick = function (ev) {
			var example = this.getAttribute('data-example');
			sourceEditor.setValue(SAMPLE_TEXTS[example].source, 1);
			macrosEditor.setValue(SAMPLE_TEXTS[example].macros, 1);
		};

		elements.forEach(function (element) {
			element.addEventListener('click', onClick);
		});
	}

	setupEditors();
	setupLinks();

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
			if (macrosTree.token.type !== '(' ||
				macrosTree.children.length !== 3 ||
				macrosTree.children[0].token.value !== 'syntax-rule') {
				throw new Error('Expected a macro definition');
			}

			espace.Expander.validatePattern(macrosTree.children[1]);

			espace.Expander.expand(
				sourceTree,
				macrosTree.children[1],
				macrosTree.children[2]
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