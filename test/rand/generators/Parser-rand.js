(() => {
	'use strict'

	const {
		randInt,
		repeat,
		sample,
		generateGibberish,
	} = Common

	const atomGenerators = [
		() => `${randInt(1, 100000)}`,
		() => generateGibberish(randInt(1, 20), 65, 90),
		() => `"${generateGibberish(randInt(1, 20), 35, 92)}"`,
	]

	const generateAtom = sample(atomGenerators)

	function generateExpression (config) {
		let remainingElements = config.maxElements

		function generateLevel () {
			remainingElements--

			if (Math.random() < config.pAtom || remainingElements <= 0) {
				return generateAtom()
			} else {
				const parts = []
				repeat(randInt(config.maxSubexpressions), () => {
					parts.push(generateLevel())
				})

				const partsString = parts.join(' ')

				return Math.random() < 0.3 ? `(${partsString})`
					: Math.random() < 0.5 ? `[${partsString}]`
					: `{${partsString}}`
			}
		}

		return generateLevel()
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

	const testCount = 10

	configs.forEach((config) => {
		rand.TaskRunner.push(() => {
			rand.HtmlReporter.describe('Well formed expressions', config, testCount)
		})

		repeat(testCount, () => {
			rand.TaskRunner.push(() => {
				const expression = generateExpression(config)
				const tokens = espace.Tokenizer.tokenize(expression)
				const tree = espace.Parser.parse(tokens)
				const serializedExpression = espace.Serializer.serialize(tree)

				if (expression !== serializedExpression) {
					rand.HtmlReporter.report(`Found mismatch${expression}<hr>${serializedExpression}`)
				}

				rand.HtmlReporter.advance()
			})
		})
	})
})()
