espace.js
=========

S-expression parser in JavaScript

Usage
-----

```javascript
var tokens = espace.Tokenizer()('(fun 10 20)');
var tree = espace.Parser.parse(tokens);
```