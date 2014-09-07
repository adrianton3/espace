(function () {
	'use strict';

	var Expander = {};

	function extract(source, pattern) {
		var map = {};

		function extract(source, pattern) {
			if (pattern.token.type === '(') {
				if (source.token.type !== '(') {
					return false;
				}

				// just a precheck before we dive in
				if (pattern.rest) {
					if (source.tree.length < pattern.rest.before + 1 + pattern.rest.after) {
						return false;
					}
				} else {
					if (source.tree.length !== pattern.tree.length) {
						return false;
					}
				}

				// first symbol must be the same alphanumeric in both cases
				if (source.tree[0].token.type !== 'alphanum' ||
					source.tree[0].token.value !== pattern.tree[0].token.value) {
					return false;
				}

				// the rest have to match
				if (pattern.rest) {
					for (var i = 1; i <= pattern.rest.before; i++) {
						if (!extract(source.tree[i], pattern.tree[i])) {
							return false;
						}
					}

					map[pattern.rest.name] = source.tree.slice(
							1 + pattern.rest.before,
							source.tree.length - pattern.rest.after
						);

					for (var i = 0; i < pattern.rest.after; i++) {
						if (!extract(
								source.tree[source.tree.length - pattern.rest.after + i],
								pattern.tree[i + 1 + 1 + pattern.rest.before])
							) {
							return false;
						}
					}
				} else {
					for (var i = 1; i < pattern.tree.length; i++) {
						if (!extract(source.tree[i], pattern.tree[i])) {
							return false;
						}
					}
				}

				return true;
			} else {
				map[pattern.token.value] = source;
				return true;
			}
		}

		if (extract(source, pattern, map)) {
			return map;
		} else {
			return null;
		}
	}

	Expander.extract = extract;


	function deepClone(tree) {
		var treeClone = {
			token: {
				type: tree.token.type
			}
		};

		if (tree.token.hasOwnProperty('value')) {
			treeClone.token.value = tree.token.value;
		}

		if (tree.token.type === '(') {
			treeClone.tree = tree.tree.map(function (subtree) {
				return deepClone(subtree);
			});
		}

		return treeClone;
	}

	Expander.deepClone = deepClone;


	function insert(array, start, subArray) {
		var args = [start, 1].concat(subArray);
		Array.prototype.splice.apply(array, args);
		return array;
	}

	function inject(tree, map) {
		function inject(tree) {
			for (var i = 1; i < tree.tree.length; i++) {
				var child = tree.tree[i];

				if (child.token.type === 'alphanum') {
					var replaceTree = map[child.token.value];
					if (Array.isArray(replaceTree)) {
						insert(tree.tree, i, replaceTree);
						i += replaceTree.length - 1;
					} else if (replaceTree) {
						tree.tree[i] = replaceTree;
					}
				} else if (child.token.type === '(') {
					inject(child);
				}
			}
		}

		if (tree.token.type === 'alphanum') {
			var replaceTree = map[tree.token.value];
			if (replaceTree) {
				tree.token = replaceTree.token;
				if (replaceTree.token.type === '(') {
					tree.tree = replaceTree.tree;
				}
			}
		} else if (tree.token.type === '(') {
			inject(tree);
		}
	}

	Expander.inject = inject;


	function isRest(string) {
		return string.length > 3 && string.substr(string.length - 3) === '...';
	}

	function processForRest(tree) {
		function traverse(tree) {
			if (tree.token.type === '(') {
				for (var i = 1; i < tree.tree.length; i++) {
					var token = tree.tree[i].token;
					if (token.type === 'alphanum' && isRest(token.value)) {
						tree.rest = {
							before: i - 1,
							after: tree.tree.length - i - 1,
							name: token.value
						};
					} else {
						traverse(tree.tree[i]);
					}
				}
			}
		}

		traverse(tree);
		return tree;
	}

	Expander.processForRest = processForRest;


	function validatePattern(tree) {
		var set = {};

		function traverse(tree) {
			if (tree.tree.length > 0 && tree.tree[0].token.type !== 'alphanum') {
				throw new Error('Tokens of type ' + tree.tree[0].token.type + ' are not allowed in patterns');
			}

			var rest = false;
			for (var i = 1; i < tree.tree.length; i++) {
				var subTree = tree.tree[i];

				if (subTree.token.type === 'alphanum') {
					if (set[subTree.token.value]) {
						throw new Error('Variable "' + subTree.token.value + '" already used in pattern');
					} else {
						set[subTree.token.value] = true;
					}

					if (isRest(subTree.token.value)) {
						if (rest) {
							throw new Error('Pattern can contain at most one rest variable on a level');
						}
						rest = true;
					}
				} else if (subTree.token.type === '(') {
					traverse(subTree);
				} else {
					throw new Error('Tokens of type ' + subTree.token.type + ' are not allowed in patterns');
				}
			}
		}

		if (tree.token.type === '(') {
			traverse(tree);
		} else {
			throw new Error('Pattern must not be an atom');
		}
	}

	Expander.validatePattern = validatePattern;


	Expander.expand = function (source, pattern, substitute) {
		processForRest(pattern);

		function traverse(source) {
			var map = extract(source, pattern);
			if (map) {
				var newSubtree = deepClone(substitute);
				inject(newSubtree, map);

				// putting it back together
				source.token = newSubtree.token;
				source.tree = newSubtree.tree;
			}

			if (source.token.type === '(') {
				source.tree.forEach(traverse);
			}
		}

		traverse(source);
	};


	window.espace = window.espace || {};
	window.espace.Expander = Expander;
})();