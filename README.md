espace
======

S-expression parser in JavaScript

+ [Tokens](http://adrianton3.github.io/espace.js/examples/tokens/tokens.html)
+ [Tree](http://adrianton3.github.io/espace.js/examples/tree/tree.html)
+ [Macros](http://adrianton3.github.io/espace.js/examples/macros/macros.html)

#### Tokenizer

```javascript
const options = { 
    whitespace: false,
    comments: false,
    coords: true,
    prefixes: {
        '#': 'map',
    },
}

const source = '(fun (a b) (+ a b))'
const tokens = espace.Tokenizer.tokenize(source, options) //
```

#### Parser

```javascript
const source = '(fun (a b) (+ a b))'
const tokens = espace.Tokenizer.tokenize(source)
const tree = espace.Parser.parse(tokens) //
```

#### Macro expander

```javascript
const source = '(+ a b c)'
const pattern = '(+ x y z)'
const replace = '(+ (+ x y) z)'

const parse = (source) => 
    espace.Parser.parse(espace.Tokenizer.tokenize(source))

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
