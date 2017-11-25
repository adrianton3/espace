(() => {
	'use strict'

	const {
		repeat,
		generateGibberish,
	} = Common

	const testCount = 100

	rand.TaskRunner.push(() => {
		rand.HtmlReporter.describe('Random strings', {}, testCount)
	})

	repeat(testCount, () => {
		rand.TaskRunner.push(() => {
			const gibberish = generateGibberish(50, 32, 127)

			try {
				const tokens = espace.Tokenizer.tokenize(gibberish)
				const tree = espace.Parser.parse(tokens)
				const serializedExpression = espace.Serializer.serialize(tree)
			} catch (ex) {
				if (!ex.hasOwnProperty('coords')) {
					rand.HtmlReporter.report(gibberish)
				}
			}

			rand.HtmlReporter.advance()
		})
	})
})()
