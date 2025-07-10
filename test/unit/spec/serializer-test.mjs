import { serialize } from '../../../src/serializer.mjs'


describe('serializer', () => {
    it('can serialize a number', () => {
        const tree = {
            type: 'atom',
            token: {
                type: 'number',
                value: 123,
            },
        }

        expect(serialize(tree)).toEqual('123')
    })

    it('can serialize two numbers', () => {
        const tree = [{
            type: 'atom',
            token: {
                type: 'number',
                value: 123,
            },
        }, {
            type: 'atom',
            token: {
                type: 'number',
                value: 321,
            },
        }]

        expect(serialize(tree)).toEqual('123\n\n321')
    })

    it('can serialize a string', () => {
        const tree = {
            type: 'atom',
            token: {
                type: 'string',
                value: 'asd',
            },
        }

        expect(serialize(tree)).toEqual('"asd"')
    })

    it('can serialize an identifier', () => {
        const tree = {
            type: 'atom',
            token: {
                type: 'identifier',
                value: 'asd',
            },
        }

        expect(serialize(tree)).toEqual('asd')
    })

    it('can serialize ()', () => {
        const tree = {
            type: 'list',
            token: {
                type: 'open',
                value: '(',
            },
            children: [],
        }

        expect(serialize(tree)).toEqual('()')
    })

    it('can serialize () ()', () => {
        const tree = [{
            type: 'list',
            token: {
                type: 'open',
                value: '(',
            },
            children: [],
        }, {
            type: 'list',
            token: {
                type: 'open',
                value: '(',
            },
            children: [],
        }]

        expect(serialize(tree)).toEqual('()\n\n()')
    })

    it('can serialize []', () => {
        const tree = [{
            type: 'list',
            token: {
                type: 'open',
                value: '[',
            },
            children: [],
        }]

        expect(serialize(tree)).toEqual('[]')
    })

    it('can serialize (())', () => {
        const tree = {
            type: 'list',
            token: {
                type: 'open',
                value: '(',
            },
            children: [{
                type: 'list',
                token: {
                    type: 'open',
                    value: '(',
                },
                children: [],
            }],
        }

        expect(serialize(tree)).toEqual('(())')
    })

    it('can serialize an expression', () => {
        const tree = {
            type: 'list',
            token: {
                type: 'open',
                value: '(',
            },
            children: [{
                type: 'atom',
                token: {
                    type: 'identifier',
                    value: '+',
                },
            }, {
                type: 'atom',
                token: {
                    type: 'number',
                    value: 123,
                },
            }, {
                type: 'atom',
                token: {
                    type: 'number',
                    value: 456,
                },
            }],
        }

        expect(serialize(tree)).toEqual('(+ 123 456)')
    })
})
