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
    const selection = document.getElementsByClassName('link')
    const elements = Array.prototype.slice.call(selection, 0)

    const handleClick = function (_ev) {
        const example = this.getAttribute('data-example')
        sourceEditor.setValue(SAMPLE_TEXTS[example].source, 1)
        macrosEditor.setValue(SAMPLE_TEXTS[example].macros, 1)
    }

    elements.forEach(function (element) {
        element.addEventListener('click', handleClick)
    })
}

setupEditors()
setupLinks()

function handleInput () {
    const sourceText = sourceEditor.getValue()
    const macrosText = macrosEditor.getValue()

    const getTree = (text) => parse(tokenize(text))

    try {
        const sourceTree = getTree(sourceText)[0] // for every member

        const macrosTree = getTree(macrosText)[0] // apply every macro

        if (
            macrosTree.type !== 'list' ||
            macrosTree.children.length !== 3 ||
            macrosTree.children[0].token.value !== 'syntax-rule'
        ) {
            throw new Error('Expected a macro definition')
        }

        validateRule(macrosTree.children[1], macrosTree.children[2])

        expand(
            sourceTree,
            macrosTree.children[1],
            macrosTree.children[2],
        )

        outputEditor.setValue(serialize(sourceTree), 1)
    } catch (ex) {
        const exceptionObject = {
            message: ex.message,
        }

        outputEditor.setValue(JSON.stringify(exceptionObject, null, 2), 1)
    }
}
