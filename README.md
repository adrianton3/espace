espace.js
=========

S-expression parser in JavaScript

Try it
------

[Tokens](http://madflame991.github.io/espace.js/examples/tokens/tokens.html)
[Tree](http://madflame991.github.io/espace.js/examples/tree/tree.html)


Usage
-----

```javascript
var tokens = espace.Tokenizer()('(fun 10 20)');
var tree = espace.Parser.parse(tokens);
```