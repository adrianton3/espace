import { tokenize } from '../../../src/tokenizer.mjs'
import { parse } from '../../../src/parser.mjs'
import { serialize } from '../../../src/serializer.mjs'

import { repeat, generateGibberish } from '../common.mjs'
import { push } from '../task-runner.mjs'
import { describe, report, advance } from '../reporters/html-reporter.mjs'


const testCount = 100

push(() => {
    describe('Random strings', {}, testCount)
})

repeat(testCount, () => {
    push(() => {
        const gibberish = generateGibberish(50, 32, 127)

        try {
            const tokens = tokenize(gibberish)
            const tree = parse(tokens)
            const serializedExpression = serialize(tree)
        } catch (ex) {
            if (!Object.hasOwn(ex, 'coords')) {
                report(gibberish)
            }
        }

        advance()
    })
})
