import { parse } from '../../../src/parser.mjs'


describe('parser', ()=> {
    const makeToken = (type) => (value) => ({ type, value })

    const makeNumber = makeToken('number')
    const makeString = makeToken('string')
    const makeIdentifier = makeToken('identifier')
    const makePrefix = makeToken('prefix')
    const makeOpen = makeToken('open')
    const makeClosed = makeToken('closed')

    const makeAst = {
        atom: (type, value) => ({
            type: 'atom',
            token: {
                type,
                value,
            },
        }),
        list: (value, children = []) => ({
            type: 'list',
            token: {
                type: 'open',
                value,
            },
            children,
        }),
        prefix: (value, child) => ({
            type: 'list',
            token: {
                type: 'prefix',
                value,
            },
            children: [
                makeAst.atom('identifier', value),
                child,
            ],
        }),
    }

    it('can parse nothing', () => {
        const tokens = []

        expect(parse(tokens)).toEqual([])
    })

    it('can parse an atom', () => {
        const tokens = [makeNumber(123)]

        expect(parse(tokens)).toEqual([makeAst.atom('number', 123)])
    })

    it('can parse two atoms', () => {
        const tokens = [makeNumber(123), makeNumber(321)]

        expect(parse(tokens)).toEqual([makeAst.atom('number', 123), makeAst.atom('number', 321)])
    })

    it('can parse an empty paren', () => {
        const tokens = [
            makeOpen('('),
            makeClosed(')'),
        ]

        expect(parse(tokens)).toEqual([makeAst.list('(')])
    })

    it('can parse two empty parens', () => {
        const tokens = [
            makeOpen('('),
            makeClosed(')'),
            makeOpen('['),
            makeClosed(']'),
        ]

        expect(parse(tokens)).toEqual([makeAst.list('('), makeAst.list('[')])
    })

    it('can parse a one element paren', () => {
        const tokens = [
            makeOpen('('),
            makeIdentifier('x'),
            makeClosed(')'),
        ]

        expect(parse(tokens)).toEqual([
            makeAst.list('(', [
                makeAst.atom('identifier', 'x'),
            ])
        ])
    })

    it('can parse a two element paren', () => {
        const tokens = [
            makeOpen('('),
            makeIdentifier('x'),
            makeIdentifier('y'),
            makeClosed(')'),
        ]

        expect(parse(tokens)).toEqual([
            makeAst.list('(', [
                makeAst.atom('identifier', 'x'),
                makeAst.atom('identifier', 'y'),
            ])
        ])
    })

    it('can parse a nested empty paren', () => {
        const tokens = [
            makeOpen('('),
            makeOpen('('),
            makeClosed(')'),
            makeClosed(')'),
        ]

        expect(parse(tokens)).toEqual([
            makeAst.list('(', [
                makeAst.list('(', []),
            ])
        ])
    })

    it('can parse nested parens of all types', () => {
        const tokens = [
            makeOpen('('),
            makeOpen('['),
            makeOpen('{'),
            makeClosed('}'),
            makeClosed(']'),
            makeClosed(')'),
        ]

        expect(parse(tokens)).toEqual([
            makeAst.list('(', [
                makeAst.list('[', [
                    makeAst.list('{', []),
                ])
            ])
        ])
    })

    it('can parse a one element nested paren', () => {
        const tokens = [
            makeOpen('('),
            makeOpen('('),
            makeIdentifier('x'),
            makeClosed(')'),
            makeClosed(')'),
        ]

        expect(parse(tokens)).toEqual([
            makeAst.list('(', [
                makeAst.list('(', [
                    makeAst.atom('identifier', 'x'),
                ]),
            ])
        ])
    })

    it('can parse a complex expression', () => {
        const tokens = [
            makeOpen('('),
            makeIdentifier('x'),
            makeOpen('('),
            makeIdentifier('y'),
            makeClosed(')'),
            makeIdentifier('z'),
            makeOpen('('),
            makeClosed(')'),
            makeClosed(')'),
        ]

        expect(parse(tokens)).toEqual([
            makeAst.list('(', [
                makeAst.atom('identifier', 'x'),
                makeAst.list('(', [
                    makeAst.atom('identifier', 'y'),
                ]),
                makeAst.atom('identifier', 'z'),
                makeAst.list('(', []),
            ])
        ])
    })

    it('can parse a prefixed number', () => {
        const tokens = [
            makePrefix('#'),
            makeIdentifier('x'),
        ]

        expect(parse(tokens)).toEqual([
            makeAst.prefix('#',
                makeAst.atom('identifier', 'x'),
            )
        ])
    })

    it('can parse a prefixed (', () => {
        const tokens = [
            makePrefix('#'),
            makeOpen('('),
            makeClosed(')'),
        ]

        expect(parse(tokens)).toEqual([
            makeAst.prefix('#',
                makeAst.list('(', []),
            )
        ])
    })

    it('can parse a doubly prefixed (', () => {
        const tokens = [
            makePrefix('@'),
            makePrefix('#'),
            makeOpen('('),
            makeClosed(')'),
        ]

        expect(parse(tokens)).toEqual([
            makeAst.prefix('@',
                makeAst.prefix('#',
                    makeAst.list('(', []),
                )
            )
        ])
    })

    it('throws an exception when trying to parse just (', () => {
        const tokens = [makeOpen('(')]

        expect(parse.bind(null, tokens)).toThrow(new Error('Expected matching \')\' before end of input'))
    })

    it('throws an exception when starting with a )', () => {
        const tokens = [makeClosed(')')]

        expect(parse.bind(null, tokens)).toThrow(new Error('Unexpected \')\''))
    })

    it('throws an exception when trying to parse ())', () => {
        const tokens = [
            makeOpen('('),
            makeClosed(')'),
            makeClosed(')'),
        ]

        expect(parse.bind(null, tokens)).toThrow(new Error('Unexpected \')\''))
    })

    it('throws an exception when parsing (]', () => {
        const tokens = [
            makeOpen('('),
            makeClosed(']'),
        ]

        expect(parse.bind(null, tokens)).toThrow(new Error('Expected matching \')\''))
    })
})
