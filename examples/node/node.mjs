const { tokenize, parse } = require('../../build/espace.min.mjs')


const SAMPLE_TEXT = [
    '(fun double (n)',
    ' (* n 2))',
].join('\n')


const tokens = tokenize(SAMPLE_TEXT, { coords: true })
const tree = parse(tokens)

const pretty = JSON.stringify(tree, null, 2)

console.log(pretty)
