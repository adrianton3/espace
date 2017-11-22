espace.js
=========

S-expression parser in JavaScript

Try it
------

+ [Tokens](http://adrianton3.github.io/espace.js/examples/tokens/tokens.html)
+ [Tree](http://adrianton3.github.io/espace.js/examples/tree/tree.html)
+ [Macros](http://adrianton3.github.io/espace.js/examples/macros/macros.html)


Usage
-----

####Tokenizer

```javascript
	const options = { 
		whitespace: false,
		comments: false,
		coords: true,
		prefixes: {
			'#': 'map',
		},
	}
	const tokenize = espace.Tokenizer(options)
	
	const source = '(fun (a b) (+ a b))'
	const tokens = tokenize(source) //
```

####Parser

```javascript
	const source = '(fun (a b) (+ a b))'
	const tokens = espace.Tokenizer()(source)
	const tree = espace.Parser.parse(tokens) //
```

####Macro expander

```javascript
	const source = '(+ a b c)'
	const pattern = '(+ x y z)'
	const replace = '(+ (+ x y) z)'
	
	const tokenize = espace.Tokenizer()
	const parse = (source) => 
	    espace.Parser.parse(tokenize(source))
	
	const sourceTree = parse(source)
	const patternTree = parse(pattern)
	const replaceTree = parse(replace)
	
	espace.Expander.expand(sourceTree, patternTree, replaceTree) //	
```

*Pattern* can have more than one level:
 
 + can replace all subexpressions of the form `(- (- x y))` with `(- y x)`
 
*Pattern* supports rest variables:

 + can replace all `(first (list x y...))` with `(list y...)`
 + can replace all `(last (list x... y))` with `(list x...)`
 
Variables prefixed by `_` in *replace* get uniquely named:

 + can replace all `(swap x y)` with `(let (_tmp x) (set! x y) (set! y _tmp))`
