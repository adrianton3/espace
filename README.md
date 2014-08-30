espace.js
=========

S-expression parser in JavaScript

Try it
------

[Tokenizer](http://madflame991.github.io/espace.js/examples/lexer/lexer.html)


Usage
-----

```javascript
var tokens = espace.Tokenizer()('(fun 10 20)');
var tree = espace.Parser.parse(tokens);
```