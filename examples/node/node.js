'use strict'

const { Tokenizer, Parser } = require('../../build/espace.min.js')

const SAMPLE_TEXT = [
	'(fun double (n)',
	' (* n 2))',
].join('\n')


const tokens = Tokenizer.tokenize(SAMPLE_TEXT, { coords: true })
const tree = Parser.parse(tokens)

const pretty = JSON.stringify(tree, undefined, 2)

console.log(pretty)
