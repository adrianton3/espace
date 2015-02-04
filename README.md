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
	var options = { 
		whitespace: false
		comments: false,
		coords: true
	};
	var tokenizer = espace.Tokenizer(options);
	
	var source = '(fun 10 20)';
	var tokens = tokenizer(source); //
```

####Parser

```javascript
	var source = '(fun 10 20)';
	var tokens = espace.Tokenizer()(source);
	var tree = espace.Parser.parse(tokens); //
```

####Macro expander

```javascript
	var source = '(+ a b c)';
	var pattern = '(+ x y z)';
	var replaceTree = '(+ (+ x y) z)'
	
	var tokenizer = espace.Tokenizer();
	var parse = function (source) {
		return espace.Parser.parse(tokenizer(source));
	};
	
	var sourceTree = parse(source);
	var patternTree = parse(pattern);
	var replaceTree = parse(replace);
	
	espace.Expander.expand(sourceTree, patternTree, replaceTree); //	
```

*Pattern* can have more than one level:
 
 + can replace all subexpressions of the form `(- (- x y))` with `(- y x)`
 
*Pattern* supports rest variables:

 + can replace all `(first (list x y...))` with `(list y...)`
 + can replace all `(last (list x... y))` with `(list x...)`
 
Variables prefixed by `_` in *replace* get uniquely named:

 + can replace all `(swap x y)` with `(let (_tmp x) (set! x y) (set! y _tmp))`
