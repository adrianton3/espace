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

const outputEditor = ace.edit('output-editor')
outputEditor.setTheme('ace/theme/monokai')
outputEditor.getSession().setMode('ace/mode/javascript')
outputEditor.getSession().setUseWrapMode(true)
outputEditor.setReadOnly(true)
outputEditor.setFontSize(fontSize)


function handleInput () {
    const inputText = inputEditor.getValue()

    try {
        const tokens = tokenize(inputText, {
            prefixes: {
                '\'': 'quote',
                ':': 'key',
                '@': 'set',
                '#': 'map',
            },
        })

        const tree = parse(tokens)

        outputEditor.setValue(JSON.stringify(tree, null, 2), 1)
    } catch (ex) {
        const exceptionObject = {
            message: ex.message,
            coords: ex.coords,
        }

        outputEditor.setValue(JSON.stringify(exceptionObject, null, 2), 1)
    }
}
