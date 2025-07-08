import { IterableString } from '../../../src/iterable-string.mjs'


describe('iterable-string', () => {
    it('can get the current character', () => {
        const istr = new IterableString('asd')
        expect(istr.getCurrent()).toEqual('a')
    })

    it('can get the next character', () => {
        const istr = new IterableString('asd')
        expect(istr.getNext()).toEqual('s')
    })

    it('can advance the pointer', () => {
        const istr = new IterableString('asd')
        istr.advance()
        expect(istr.getCurrent()).toEqual('s')
        expect(istr.getNext()).toEqual('d')
    })

    it('can get the marked substring of a string', () => {
        const istr = new IterableString('asdfgh')
        istr.advance()
        istr.setMarker()
        istr.advance()
        istr.advance()
        expect(istr.getMarked()).toEqual('sd')
    })
})
