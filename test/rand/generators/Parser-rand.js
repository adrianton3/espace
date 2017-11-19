(function () {
	'use strict'

	function randI (min, max) {
		if (max === undefined) {
			max = min
			min = 0
		}
		return Math.floor((max - min) * Math.random()) + min
	}

	function sample (samples) {
		return samples[Math.floor(Math.random() * samples.length)]
	}

	function randomString (length) {
		let string = ''
		for (let i = 0; i < length; i++) {
			string += String.fromCharCode(randI(65, 90))
		}
		return string
	}

	const atomGenerators = [
		function () { return '' + Math.floor(Math.random() * 100000) },
		function () { return randomString(randI(1, 20)) },
		function () { return '"' + randomString(randI(1, 20)) + '"' },
	]

	const atom = function () {
		return sample(atomGenerators)()
	}

	function generateExpression (config) {
		let remainingElements = config.maxElements

		function expression () {
			remainingElements--

			if (Math.random() < config.pAtom || remainingElements <= 0) {
				return atom()
			} else {
				const nSubexpressions = randI(config.maxSubexpressions)

				const parts = []
				for (let i = 0; i < nSubexpressions; i++) {
					parts.push(expression())
				}
				return '(' + parts.join(' ') + ')'
			}
		}

		return expression()
	}



	function repeat (times, callback) {
		for (let i = 0; i < times; i++) {
			callback(i)
		}
	}

	const configs = [{
		pAtom: 0.01,
		maxElements: 2000,
		maxSubexpressions: 3,
	}, {
		pAtom: 0.5,
		maxElements: 2000,
		maxSubexpressions: 10,
	}, {
		pAtom: 0.8,
		maxElements: 2000,
		maxSubexpressions: 1000,
	}]

	const nTest = 10
	let tokenizer

	configs.forEach(function (config) {
		rand.TaskRunner.push(function () {
			rand.HtmlReporter.describe('Well formed expressions', config, nTest)
			tokenizer = espace.Tokenizer()
		})
		repeat(nTest, function () {
			rand.TaskRunner.push(function () {
				const expression = generateExpression(config)
				const tokens = tokenizer(expression)
				const tree = espace.Parser.parse(tokens)
				const serializedExpression = espace.Serializer.serialize(tree)

				if (expression !== serializedExpression) {
					rand.HtmlReporter.report('Found mismatch' + expression + '<hr>' + serializedExpression)
				}

				rand.HtmlReporter.advance()
			})
		})
	})
})()
