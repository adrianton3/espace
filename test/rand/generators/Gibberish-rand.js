(function () {
	'use strict';

	function randI(min, max) {
		if (max === undefined) {
			max = min;
			min = 0;
		}
		return Math.floor((max - min) * Math.random()) + min;
	}

	function generateGibberish() {
		var ret = '';
		for (var i = 0; i < 50; i++) {
			ret += String.fromCharCode(randI(32, 127));
		}
		return ret;
	}

	var nTest = 100;
	var tokenizer;

	function repeat(times, callback) {
		for (var i = 0; i < times; i++) {
			callback(i);
		}
	}

	rand.TaskRunner.push(function () {
		rand.HtmlReporter.describe('Random strings', {}, nTest);
		tokenizer = espace.Tokenizer();
	});
	repeat(nTest, function () {
		rand.TaskRunner.push(function () {
			var gibberish = generateGibberish();

			try {
				var tokens = tokenizer(gibberish);
				var tree = espace.Parser.parse(tokens);
				var serializedExpression = espace.Serializer.serialize(tree);
			} catch (e) {
				if (!e.hasOwnProperty('coords')) {
					rand.HtmlReporter.report(gibberish);
				}
			}

			rand.HtmlReporter.advance();
		});
	});
})();