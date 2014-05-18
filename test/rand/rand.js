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
		function () { return Math.floor(Math.random() * 100000); },
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

	function announceMismatch(expression, serializedExpression) {
		var entry = document.createElement('p');
		entry.classList.add('mismatch');

		var title = document.createElement('h5');
		title.innerText = 'Found a pair that does not match';
		title.classList.add('mismatch-title');
		entry.appendChild(title);

		var content = document.createElement('p');
		content.innerHTML = expression + '<hr>' + serializedExpression;
		content.classList.add('mismatch-content');
		entry.appendChild(content);

		document.body.appendChild(entry);
	}

	function announceConfig(config, nTest) {
		var entry = document.createElement('div');
		entry.classList.add('config');

		var title = document.createElement('h5');
		title.classList.add('config-title');
		title.innerText = 'Running random tests with the following config ';
		entry.appendChild(title);

		var progress = document.createElement('span');
		progress.classList.add('config-progress');
		progress.innerText = '(0/' + nTest + ')';
		title.appendChild(progress);

		var content = document.createElement('p');
		content.classList.add('config-content');
		var stringifiedConfig = Object.keys(config).reduce(function (prev, key) {
			return prev + (key + ': ' + config[key] + '<br>');
		}, '');
		content.innerHTML = stringifiedConfig;
		entry.appendChild(content);

		document.body.appendChild(entry);

		return {
			progress: progress
		};
	}

	function repeat(times, callback) {
		for (var i = 0; i < times; i++) {
			callback(i);
		}
	}

	function throttle(jobs, onComplete) {
		var i = 0;

		function loop() {
			if (i >= jobs.length) {
				if (onComplete) {
					onComplete();
				}
			} else {
				jobs[i]();
				i++;
				setTimeout(loop, 4);
			}
		}

		loop();
	}

	function runTests() {
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
		var jobs = [];

		configs.forEach(function (config) {
			jobs.push(function () {
				progress = announceConfig(config, nTest).progress;
				tokenizer = espace.Tokenizer();
			});
			repeat(nTest, function (i) {
				jobs.push(function () {
					var expression = generateExpression(config);
					var tokens = tokenizer(expression);
					var tree = espace.Parser.parse(tokens);
					var serializedExpression = espace.Serializer.serialize(tree);

					if (expression !== serializedExpression) {
						announceMismatch(expression, serializedExpression);
					}

					progress.innerText = '(' + (i + 1) + '/' + nTest + ')';
				});
			});
		});

		throttle(jobs);
	}

	runTests();
})();