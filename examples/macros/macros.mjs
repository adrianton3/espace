import { tokenize, parse, serialize, validateRule, expand } from '../../build/espace.min.mjs'


const SAMPLE_TEXTS = {
    simple: {
        source: [
            '(+ a b c)',
        ].join('\n'),
        macros: [
            '(syntax-rule',
            ' (+ x y z)',
            ' (+ x (+ y z)))',
        ].join('\n'),
    },
    nested: {
        source: [
            '(- (- a b))',
        ].join('\n'),
        macros: [
            '(syntax-rule',
            ' (- (- x y))',
            ' (- y x))',
        ].join('\n'),
    },
    rest1: {
        source: [
            '(tail (list a b c d e))',
        ].join('\n'),
        macros: [
            '(syntax-rule',
            ' (tail (list x y...))',
            ' (list y...))',
        ].join('\n'),
    },
    rest2: {
        source: [
            '(init (list a b c d e))',
        ].join('\n'),
        macros: [
            '(syntax-rule',
            ' (init (list x... y))',
            ' (list x...))',
        ].join('\n'),
    },
    hygiene: {
        source: [
            '(swap a b)',
        ].join('\n'),
        macros: [
            '(syntax-rule',
            ' (swap x y)',
            ' (let (_tmp x)',
            '  (set! x y)',
            '  (set! y _tmp)))',
        ].join('\n'),
    },
}

let sourceEditor = null
let macrosEditor = null
let outputEditor = null

function setupEditors () {
    const fontSize = 20

    sourceEditor = ace.edit('source-editor')
    sourceEditor.setTheme('ace/theme/monokai')
    sourceEditor.setFontSize(fontSize)
    sourceEditor.setValue(SAMPLE_TEXTS.simple.source, 1)
    sourceEditor.on('input', handleInput)

    macrosEditor = ace.edit('macros-editor')
    macrosEditor.setTheme('ace/theme/monokai')
    macrosEditor.setFontSize(fontSize)
    macrosEditor.setValue(SAMPLE_TEXTS.simple.macros, 1)
    macrosEditor.on('input', handleInput)

    outputEditor = ace.edit('output-editor')
    outputEditor.setTheme('ace/theme/monokai')
    outputEditor.getSession().setUseWrapMode(true)
    outputEditor.setReadOnly(true)
    outputEditor.setFontSize(fontSize)
}

function setupLinks () {
    const handleClick = function (_ev) {
        const example = this.getAttribute('data-example')
        sourceEditor.setValue(SAMPLE_TEXTS[example].source, 1)
        macrosEditor.setValue(SAMPLE_TEXTS[example].macros, 1)
    }

    for (const element of document.getElementsByClassName('link')) {
        element.addEventListener('click', handleClick)
    }
}

setupEditors()
setupLinks()

function handleInput () {
    const sourceText = sourceEditor.getValue()
    const macrosText = macrosEditor.getValue()

    const getTree = (text) => parse(tokenize(text, { coords: true }))

    try {
        const sourceTrees = getTree(sourceText)

        const macroTrees = getTree(macrosText)

        for (const macroTree of macroTrees) {
            if (
                macroTree.type !== 'list' ||
                macroTree.children.length !== 3 ||
                macroTree.children[0].token.value !== 'syntax-rule'
            ) {
                const exception = new Error('Expected a macro definition of the form (syntax-rule pattern template)')
                exception.coords = macroTree.token.coords
                throw exception
            }

            validateRule(macroTree.children[1], macroTree.children[2])
        }

        for (const macroTree of macroTrees) {
            for (const sourceTree of sourceTrees) {
                expand(
                    sourceTree,
                    macroTree.children[1],
                    macroTree.children[2],
                )
            }
        }

        outputEditor.setValue(serialize(sourceTrees), 1)
    } catch (ex) {
        const exceptionObject = ex.coords != null ?
            { message: ex.message, coords: ex.coords } :
            { message: ex.message }

        outputEditor.setValue(JSON.stringify(exceptionObject, null, 2), 1)
    }
}
