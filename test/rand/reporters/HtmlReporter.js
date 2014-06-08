(function () {
	'use strict';

	var HtmlReporter = {};

	var progressElement;
	var progressValue, progressTotal;

	HtmlReporter.describe = function (description, config, nTests) {
		var entry = document.createElement('div');
		entry.classList.add('config');

		var title = document.createElement('h5');
		title.classList.add('config-title');
		title.innerText = description;
		entry.appendChild(title);

		progressValue = 0;
		progressTotal = nTests;

		var progress = document.createElement('span');
		progress.classList.add('config-progress');
		progress.innerText = '(' + progressValue + '/' + progressTotal + ')';
		title.appendChild(progress);

		if (config) {
			var content = document.createElement('p');
			content.classList.add('config-content');

			var stringifiedConfig = Object.keys(config).reduce(function (prev, key) {
				return prev + (key + ': ' + config[key] + '<br>');
			}, '');

			content.innerHTML = stringifiedConfig;
			entry.appendChild(content);
		}

		document.body.appendChild(entry);

		progressElement = progress;
	};

	HtmlReporter.report = function (message) {
		var entry = document.createElement('p');
		entry.classList.add('mismatch');

		var title = document.createElement('h5');
		title.innerText = '!';
		title.classList.add('mismatch-title');
		entry.appendChild(title);

		var content = document.createElement('p');
		content.innerHTML = message;
		content.classList.add('mismatch-content');
		entry.appendChild(content);

		document.body.appendChild(entry);
	};

	HtmlReporter.advance = function () {
		progressValue++;
		progressElement.innerText = '(' + progressValue + '/' + progressTotal + ')';
	};

	window.rand = window.rand || {};
	window.rand.HtmlReporter = HtmlReporter;
})();