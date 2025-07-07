import { tokenize } from '../../../src/tokenizer.mjs'
import { parse } from '../../../src/parser.mjs'
import { serialize } from '../../../src/serializer.mjs'

import { randInt, repeat, sample, generateGibberish } from '../common.mjs'
import { push } from '../task-runner.mjs'
import { describe, report, advance } from '../reporters/html-reporter.mjs'


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
    push(() => {
        describe('Well formed expressions', config, testCount)
    })

    repeat(testCount, () => {
        push(() => {
            const expression = generateExpression(config)
            const tokens = tokenize(expression)
            const tree = parse(tokens)
            const serializedExpression = serialize(tree)

            if (expression !== serializedExpression) {
                report(`Found mismatch${expression}<hr>${serializedExpression}`)
            }

            advance()
        })
    })
})
