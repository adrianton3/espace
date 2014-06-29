(function () {
	'use strict';

	var Expander = {};

	function extract(source, pattern) {
		var map = {};

		function extract(source, pattern) {
			if (pattern.token.type === '(') {
				if (source.token.type !== '(' ||
					source.tree.length !== pattern.tree.length) {
					return false;
				}

				// just a precheck before we dive in
				if (source.tree.length !== pattern.tree.length) {
					return false;
				}

				// first symbol must be the same alphanumeric in both cases
				if (source.tree[0].token.type !== 'alphanum' ||
					source.tree[0].token.value !== pattern.tree[0].token.value) {
					return false;
				}

				// the rest have to match
				for (var i = 1; i < pattern.tree.length; i++) {
					if (!extract(source.tree[i], pattern.tree[i])) {
						return false;
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

	function inject(tree, map) {
		function inject(tree) {
			if (tree.token.type === 'alphanum') {
				if (map[tree.token.value]) {
					var replaceTree = map[tree.token.value];
					tree.token = replaceTree.token;
					if (replaceTree.token.type === '(') {
						tree.tree = replaceTree.tree;
					}
				}
			} else if (tree.token.type === '(') {
				tree.tree.forEach(inject);
			}
		}

		inject(tree);
	}

	Expander.inject = inject;

	Expander.expand = function (source, pattern, substitute, vars) {
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