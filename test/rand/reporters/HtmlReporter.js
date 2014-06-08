(function () {
	'use strict';

	var HtmlReporter = {};

	HtmlReporter.announceMismatch = function (expected, obtained) {
		var entry = document.createElement('p');
		entry.classList.add('mismatch');

		var title = document.createElement('h5');
		title.innerText = 'Found a pair that does not match';
		title.classList.add('mismatch-title');
		entry.appendChild(title);

		var content = document.createElement('p');
		content.innerHTML = expected + '<hr>' + obtained;
		content.classList.add('mismatch-content');
		entry.appendChild(content);

		document.body.appendChild(entry);
	};

	HtmlReporter.announceConfig = function (config, nTest) {
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
	};

	window.rand = window.rand || {};
	window.rand.HtmlReporter = HtmlReporter;
})();