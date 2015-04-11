'use strict';

var espace = require('../../build/espace.min.js');

var SAMPLE_TEXT = [
	'(fun double (n)',
	' (* n 2))'
].join('\n');


var tokenizer = espace.Tokenizer({ coords: true });
var tokens = tokenizer(SAMPLE_TEXT);
var tree = espace.Parser.parse(tokens);

var pretty = JSON.stringify(tree, undefined, 2);

console.log(pretty);
