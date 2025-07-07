let progressElement
let progressValue, progressTotal

function describe (description, config, nTests) {
    const entry = document.createElement('div')
    entry.classList.add('config')

    const title = document.createElement('h5')
    title.classList.add('config-title')
    title.innerText = description
    entry.appendChild(title)

    progressValue = 0
    progressTotal = nTests

    const progress = document.createElement('span')
    progress.classList.add('config-progress')
    progress.innerText = '(' + progressValue + '/' + progressTotal + ')'
    title.appendChild(progress)

    if (config) {
        const content = document.createElement('p')
        content.classList.add('config-content')

        const stringifiedConfig = Object.keys(config).reduce(function (prev, key) {
            return prev + (key + ': ' + config[key] + '<br>')
        }, '')

        content.innerHTML = stringifiedConfig
        entry.appendChild(content)
    }

    document.body.appendChild(entry)

    progressElement = progress
}

function report (message) {
    const entry = document.createElement('p')
    entry.classList.add('mismatch')

    const title = document.createElement('h5')
    title.innerText = '!'
    title.classList.add('mismatch-title')
    entry.appendChild(title)

    const content = document.createElement('p')
    content.innerHTML = message
    content.classList.add('mismatch-content')
    entry.appendChild(content)

    document.body.appendChild(entry)
}

function advance () {
    progressValue++
    progressElement.innerText = '(' + progressValue + '/' + progressTotal + ')'
}


export {
    describe,
    report,
    advance,
}
