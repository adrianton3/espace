import { tokenize } from '../../build/espace.min.mjs'


const SAMPLE_TEXT = [
    `(let ([a (+ 1 2)]`,
    `      [b "asd"]`,
    `      [c 'zxc]`,
    `      [d 0b1101])`,
    `     (+ a d))`,
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
        const tokens = tokenize(inputText, { prefixes: { "'": 'quote' } })

        outputEditor.setValue(JSON.stringify(tokens, null, 2), 1)
    } catch (ex) {
        const exceptionObject = {
            message: ex.message,
            coords: ex.coords,
        }

        outputEditor.setValue(JSON.stringify(exceptionObject, null, 2), 1)
    }
}
