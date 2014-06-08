(function () {
	'use strict';

	function randI(min, max) {
		if (max === undefined) {
			max = min;
			min = 0;
		}
		return Math.floor((max - min) * Math.random()) + min;
	}

	function sample(samples) {
		return samples[Math.floor(Math.random() * samples.length)];
	}

	function randomString(length) {
		var string = '';
		for (var i = 0; i < length; i++) {
			string += String.fromCharCode(randI(65, 90))
		}
		return string;
	}

	var atomGenerators = [
		function () { return '' + Math.floor(Math.random() * 100000); },
		function () { return randomString(randI(1, 20)); },
		function () { return '"' + randomString(randI(1, 20)) + '"'; }
	];

	var atom = function () {
		return sample(atomGenerators)();
	};

	function generateExpression(config) {
		var remainingElements = config.maxElements;

		function expression() {
			remainingElements--;

			if (Math.random() < config.pAtom || remainingElements <= 0) {
				return atom();
			} else {
				var nSubexpressions = randI(config.maxSubexpressions);

				var parts = [];
				for (var i = 0; i < nSubexpressions; i++) {
					parts.push(expression());
				}
				return '(' + parts.join(' ') + ')';
			}
		}

		return expression();
	}



	function repeat(times, callback) {
		for (var i = 0; i < times; i++) {
			callback(i);
		}
	}

	var configs = [{
		pAtom: 0.01,
		maxElements: 2000,
		maxSubexpressions: 3
	}, {
		pAtom: 0.5,
		maxElements: 2000,
		maxSubexpressions: 10
	}, {
		pAtom: 0.8,
		maxElements: 2000,
		maxSubexpressions: 1000
	}];

	var nTest = 10;
	var progress;
	var tokenizer;

	configs.forEach(function (config) {
		rand.TaskRunner.push(function () {
			progress = rand.HtmlReporter.announceConfig(config, nTest).progress;
			tokenizer = espace.Tokenizer();
		});
		repeat(nTest, function (i) {
			rand.TaskRunner.push(function () {
				var expression = generateExpression(config);
				var tokens = tokenizer(expression);
				var tree = espace.Parser.parse(tokens);
				var serializedExpression = espace.Serializer.serialize(tree);

				if (expression !== serializedExpression) {
					rand.HtmlReporter.announceMismatch(expression, serializedExpression);
				}

				progress.innerText = '(' + (i + 1) + '/' + nTest + ')';
			});
		});
	});

	rand.TaskRunner.start();
})();