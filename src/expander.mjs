function extract (source, pattern) {
    const map = {}

    function extract (source, pattern) {
        if (pattern.type === 'list') {
            if (source.type !== 'list' || source.token.value !== pattern.token.value) {
                return false
            }

            // just a precheck before we dive in
            if (pattern.rest) {
                if (source.children.length < pattern.rest.before + 1 + pattern.rest.after) {
                    return false
                }
            } else {
                if (source.children.length !== pattern.children.length) {
                    return false
                }
            }

            // first symbol must be the same identifier in both cases
            if (
                source.children[0].token.type !== 'identifier' ||
                source.children[0].token.value !== pattern.children[0].token.value
            ) {
                return false
            }

            // the rest have to match
            if (pattern.rest) {
                for (let i = 1; i <= pattern.rest.before; i++) {
                    if (!extract(source.children[i], pattern.children[i])) {
                        return false
                    }
                }

                map[pattern.rest.name] = source.children.slice(
                    1 + pattern.rest.before,
                    source.children.length - pattern.rest.after
                )

                for (let i = 0; i < pattern.rest.after; i++) {
                    if (!extract(
                        source.children[source.children.length - pattern.rest.after + i],
                        pattern.children[i + 1 + 1 + pattern.rest.before])
                    ) {
                        return false
                    }
                }
            } else {
                for (let i = 1; i < pattern.children.length; i++) {
                    if (!extract(source.children[i], pattern.children[i])) {
                        return false
                    }
                }
            }

            return true
        } else {
            map[pattern.token.value] = source

            return true
        }
    }

    return extract(source, pattern) ? map : null
}


function deepClone (tree) {
    const treeClone = {
        type: tree.type,
        token: {
            type: tree.token.type,
            value: tree.token.value,
        },
    }

    if (tree.type === 'list') {
        treeClone.children = tree.children.map(deepClone)
    }

    return treeClone
}


function isPrefixed (string) {
    return string.length > 1 && string[0] === '_'
}

function inject (tree, map, suffixes) {
    const suffixesThisRound = {}

    function inject (tree) {
        if (tree.children.length > 0) {
            const child = tree.children[0]

            if (isPrefixed(child.token.value)) {
                if (!suffixesThisRound[child.token.value]) {
                    if (typeof suffixes[child.token.value] !== 'undefined') {
                        suffixes[child.token.value]++
                    } else {
                        suffixes[child.token.value] = 0
                    }

                    suffixesThisRound[child.token.value] = `${child.token.value}_${suffixes[child.token.value]}`
                }

                child.token.value = suffixesThisRound[child.token.value]
            }
        }

        for (let i = 1; i < tree.children.length; i++) {
            const child = tree.children[i]

            if (child.token.type === 'identifier') {
                const replaceTree = map[child.token.value]
                if (Array.isArray(replaceTree)) {
                    tree.children.splice(i, 1, ...replaceTree)
                    i += replaceTree.length - 1
                } else if (replaceTree) {
                    tree.children[i] = replaceTree
                } else if (isPrefixed(child.token.value)) {
                    if (!suffixesThisRound[child.token.value]) {
                        if (typeof suffixes[child.token.value] !== 'undefined') {
                            suffixes[child.token.value]++
                        } else {
                            suffixes[child.token.value] = 0
                        }

                        suffixesThisRound[child.token.value] = child.token.value + '_' + suffixes[child.token.value]
                    }

                    child.token.value = suffixesThisRound[child.token.value]
                }
            } else if (child.type === 'list') {
                inject(child)
            }
        }
    }

    if (tree.token.type === 'identifier') {
        const replaceTree = map[tree.token.value]
        if (replaceTree) {
            tree.token = replaceTree.token
            if (replaceTree.type === 'list') {
                tree.children = replaceTree.children
            }
        }
    } else if (tree.type === 'list') {
        inject(tree)
    }
}


function isRest (string) {
    return string.length > 3 && string.slice(-3) === '...'
}

function processForRest (tree) {
    function traverse (tree) {
        if (tree.type !== 'list') { return }

        for (let i = 1; i < tree.children.length; i++) {
            const { token } = tree.children[i]

            if (token.type === 'identifier' && isRest(token.value)) {
                tree.rest = {
                    before: i - 1,
                    after: tree.children.length - i - 1,
                    name: token.value,
                }
            } else {
                traverse(tree.children[i])
            }
        }
    }

    traverse(tree)
}


function validateRule (pattern, substitute) {
    const vars = new Set
    const rests = new Set

    function traversePattern (tree) {
        if (tree.children.length > 0 && tree.children[0].token.type !== 'identifier') {
            throw new Error(`Tokens of type ${tree.children[0].token.type} are not allowed in patterns`)
        }

        let rest = false
        for (let i = 1; i < tree.children.length; i++) {
            const subTree = tree.children[i]

            if (subTree.token.type === 'identifier') {
                if (isPrefixed(subTree.token.value)) {
                    throw new Error('Pattern can not contain variables prefixed by \'_\'')
                }

                if (isRest(subTree.token.value)) {
                    const restless = subTree.token.value.slice(0, -3)
                    if (vars.has(restless)) {
                        throw new Error(`Variable '${restless}' already used in pattern`)
                    } else {
                        vars.add(restless)
                    }

                    if (rest) {
                        throw new Error('Pattern can contain at most one rest variable on a level')
                    }
                    rest = true
                    rests.add(subTree.token.value)
                } else {
                    if (vars.has(subTree.token.value)) {
                        throw new Error(`Variable '${subTree.token.value}' already used in pattern`)
                    } else {
                        vars.add(subTree.token.value)
                    }
                }
            } else if (subTree.type === 'list') {
                traversePattern(subTree)
            } else {
                throw new Error(`Tokens of type ${subTree.token.type} are not allowed in patterns`)
            }
        }
    }

    function traverseSubstitute (tree) {
        if (tree.type === 'atom') {
            if (
                tree.token.type === 'identifier' &&
                isRest(tree.token.value) &&
                !rests.has(tree.token.value)
            ) {
                throw new Error(`Rest variable '${tree.token.value}' is not present in pattern`)
            }

            return
        }

        for (let i = 0; i < tree.children.length; i++) {
            traverseSubstitute(tree.children[i])
        }
    }

    if (pattern.type === 'list') {
        traversePattern(pattern)
    } else {
        throw new Error('Pattern can not be an atom')
    }

    traverseSubstitute(substitute)
}


function expand (source, pattern, substitute, suffixes = {}) {
    processForRest(pattern)

    function traverse (source) {
        const map = extract(source, pattern)

        if (map) {
            const newSubtree = deepClone(substitute)
            inject(newSubtree, map, suffixes)

            // putting it back together
            source.token = newSubtree.token
            source.children = newSubtree.children
        }

        if (source.type === 'list') {
            source.children.forEach(traverse)
        }
    }

    traverse(source)
}


export {
    extract,
    deepClone,
    inject,
    processForRest,
    validateRule,
    expand,
}
