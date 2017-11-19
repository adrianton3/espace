'use strict'

const espace = require('../../build/espace.min.js')

const SAMPLE_TEXT = [
	'(fun double (n)',
	' (* n 2))',
].join('\n')


const tokenizer = espace.Tokenizer({ coords: true })
const tokens = tokenizer(SAMPLE_TEXT)
const tree = espace.Parser.parse(tokens)

const pretty = JSON.stringify(tree, undefined, 2)

console.log(pretty)
