(() => {
	'use strict'

	function randInt (minOrMax, max) {
		return arguments.length < 2 ?
			Math.floor(minOrMax * Math.random()) :
			Math.floor((max - minOrMax) * Math.random()) + minOrMax
	}

	function repeat (times, callback) {
		for (let i = 0; i < times; i++) {
			callback(i)
		}
	}

	function sample (array) {
		return array[randInt(array.length)]
	}

	function generateGibberish (length, minCharCode, maxCharCode) {
		let ret = ''
		repeat(length, () => {
			ret += String.fromCharCode(randInt(minCharCode, maxCharCode))
		})
		return ret
	}

	window.Common = {
		randInt,
		repeat,
		sample,
		generateGibberish,
	}
})()