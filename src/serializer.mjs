function serialize (expression) {
    if (expression instanceof Array) {
        return expression.map(serialize).join('\n\n')
    }

    if (expression.type === 'list') {
        if (expression.token.type === 'prefix') {
            return `${expression.token.value}${serialize(expression.children[0])}`
        } else {
            const childrenString = expression.children.map(serialize).join(' ')

            return expression.token.value === '(' ? `(${childrenString})`
                : expression.token.value === '[' ? `[${childrenString}]`
                : `{${childrenString}}`
        }
    }

    switch (expression.token.type) {
        case 'string':
            return `"${expression.token.value}"`
        case 'number':
            return String(expression.token.value)
        case 'identifier':
            return expression.token.value
    }
}


export {
    serialize,
}
