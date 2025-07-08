function IterableString (string) {
    this.string = string
    this.pointer = 0
    this.marker = 0

    this.line = 1
    this.column = 1
}

IterableString.prototype.advance = function () {
    if (this.getCurrent() === '\n') {
        this.line++
        this.column = 1
    } else {
        this.column++
    }

    this.pointer++
}

IterableString.prototype.setMarker = function (offset = 0) {
    this.marker = this.pointer + offset
}

IterableString.prototype.hasCurrent = function () {
    return this.pointer < this.string.length
}

IterableString.prototype.getCurrent = function () {
    return this.string.charAt(this.pointer)
}

IterableString.prototype.hasNext = function () {
    return this.pointer < this.string.length - 1
}

IterableString.prototype.getNext = function () {
    return this.string.charAt(this.pointer + 1)
}

IterableString.prototype.hasNextNext = function () {
    return this.pointer < this.string.length - 2
}

IterableString.prototype.getNextNext = function () {
    return this.string.charAt(this.pointer + 2)
}

IterableString.prototype.getMarked = function (offset = 0) {
    return this.string.substring(this.marker, this.pointer + offset)
}

IterableString.prototype.getCoords = function () {
    return {
        line: this.line,
        column: this.column,
    }
}


export {
    IterableString,
}
