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
			if (tree.token.type === 'alphanum') {
				if (map[tree.token.value]) {
					var replaceTree = map[tree.token.value];
					if (!Array.isArray(replaceTree)) {
						tree.token = replaceTree.token;
						if (replaceTree.token.type === '(') {
							tree.tree = replaceTree.tree;
						}
					}
				}
			} else if (tree.token.type === '(') {
				tree.tree.forEach(inject);
				if (tree.rest) {
					insert(tree.tree, tree.rest.before + 1, map[tree.rest.name]);
				}
			}
		}

		inject(tree);
	}

	Expander.inject = inject;


	function isRest(string) {
		return string.length > 3 && string.substr(string.length - 3) === '...';
	}

	function extractRestName(string) {
		return string.substr(0, string.length - 3);
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
							name: extractRestName(token.value)
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


	Expander.expand = function (source, pattern, substitute) {
		processForRest(pattern);

		function traverse(source) {
			var map = extract(source, pattern);
			if (map) {
				var newSubtree = deepClone(substitute);
				processForRest(newSubtree);
				inject(newSubtree, map);

				// newSubtree is now polluted with extra .rest properties
				// deepCLone will ignore them
				newSubtree = deepClone(newSubtree);

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