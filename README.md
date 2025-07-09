espace
======

S-expression parser in JavaScript

+ [Parser demo](http://adrianton3.github.io/espace/examples/parse/)
+ [Macros demo](http://adrianton3.github.io/espace/examples/macros/)

#### Tokenizer

```javascript
const options = { 
    coords: true,
    prefixes: {
        '#': 'map',
        ':': 'key',
    },
}

const source = '(fun (a b) (+ a b))'
const tokens = tokenize(source, options) //
```

#### Parser

```javascript
const source = '(fun (a b) (+ a b))'
const tree = parse(tokenize(source)) //
```

#### Macro expander

```javascript
const source = '(+ a b c)'
const pattern = '(+ x y z)'
const replace = '(+ (+ x y) z)'

const getTree = (source) => parse(tokenize(source))

const sourceTree = getTree(source)
const patternTree = getTree(pattern)
const replaceTree = getTree(replace)

expand(sourceTree, patternTree, replaceTree) //
```

*Pattern* can have more than one level:
 
 + can replace all subexpressions of the form `(- (- x y))` with `(- y x)`
 
*Pattern* supports rest variables:

 + can replace all `(first (list x y...))` with `(list y...)`
 + can replace all `(last (list x... y))` with `(list x...)`
 
Variables prefixed by `_` in *replace* get uniquely named:

 + can replace all `(swap x y)` with `(let (_tmp x) (set! x y) (set! y _tmp))`
