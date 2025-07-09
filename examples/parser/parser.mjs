import { tokenize, parse } from '../../build/espace.min.mjs'


const SAMPLE_TEXT = [
    '(fun double (n)',
    ' (* n 2))',
].join('\n')


const fontSize = 20

const inputEditor = ace.edit('input-editor')
inputEditor.setTheme('ace/theme/monokai')
inputEditor.setFontSize(fontSize)
inputEditor.setValue(SAMPLE_TEXT, 1)
inputEditor.on('input', handleInput)

const tokensEditor = ace.edit('tokens-editor')
tokensEditor.setTheme('ace/theme/monokai')
tokensEditor.getSession().setMode('ace/mode/javascript')
tokensEditor.getSession().setUseWrapMode(true)
tokensEditor.setReadOnly(true)
tokensEditor.setFontSize(fontSize)

const treeEditor = ace.edit('tree-editor')
treeEditor.setTheme('ace/theme/monokai')
treeEditor.getSession().setMode('ace/mode/javascript')
treeEditor.getSession().setUseWrapMode(true)
treeEditor.setReadOnly(true)
treeEditor.setFontSize(fontSize)


function handleInput () {
    const inputText = inputEditor.getValue()

    let tokens = null

    try {
        tokens = tokenize(inputText, {
            prefixes: {
                '\'': 'quote',
                ':': 'key',
                '@': 'set',
                '#': 'map',
            },
        })

        tokensEditor.setValue(JSON.stringify(tokens, null, 2), 1)
    } catch (ex) {
        const exceptionObject = { message: ex.message, coords: ex.coords }

        tokensEditor.setValue(JSON.stringify(exceptionObject, null, 2), 1)
        treeEditor.setValue('', 1)
    }

    if (tokens == null) {
        return
    }

    try {
        const tree = parse(tokens)

        treeEditor.setValue(JSON.stringify(tree, null, 2), 1)
    } catch (ex) {
        const exceptionObject = { message: ex.message, coords: ex.coords }

        treeEditor.setValue(JSON.stringify(exceptionObject, null, 2), 1)
    }
}
