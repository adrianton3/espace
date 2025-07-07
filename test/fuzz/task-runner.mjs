const queue = []

function push (task) {
    queue.push(task)
}

function start (onComplete) {
    let i = 0

    function loop () {
        if (i >= queue.length) {
            if (onComplete) {
                onComplete()
            }
        } else {
            queue[i]()
            i++
            setTimeout(loop, 4)
        }
    }

    loop()
}


export {
    push,
    start,
}
