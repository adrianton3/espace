(function () {
	'use strict';

	var CustomMatchers = {};

	CustomMatchers.toThrowWithMessage = function (util, customEqualityTesters) {
		return {
			compare: function (actual, expected) {
				var result = {};
				try {
					actual();
					result.pass = false;
					result.message = 'Expected function to throw an exception';
				} catch (ex) {
					if (ex.message != expected) {
						result.pass = false;
						result.message =
							'Expected function to throw an exception with the message "' + expected + '"' +
							' but instead received ' + (ex.message ? '"' + ex.message + '"' : 'no message');
					} else {
						result.pass = true;
					}
				}

				return result;
			}
		};
	};


	window.meta = window.meta || {};
	window.meta.CustomMatchers = CustomMatchers;
})();