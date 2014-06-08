(function () {
	'use strict';

	var TaskRunner = {};

	var queue = [];

	TaskRunner.push = function (task) {
		queue.push(task);
	};

	TaskRunner.start = function (onComplete) {
		var i = 0;

		function loop() {
			if (i >= queue.length) {
				if (onComplete) {
					onComplete();
				}
			} else {
				queue[i]();
				i++;
				setTimeout(loop, 4);
			}
		}

		loop();
	};

	window.rand = window.rand || {};
	window.rand.TaskRunner = TaskRunner;
})();