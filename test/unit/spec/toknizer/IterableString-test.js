describe('IterableString', function () {
	const IterableString = espace.IterableString

	it('can get the current character', function () {
		const istr = new IterableString('asd')
		expect(istr.current()).toEqual('a')
	})

	it('can get the next character', function () {
		const istr = new IterableString('asd')
		expect(istr.next()).toEqual('s')
	})

	it('can advance the pointer', function () {
		const istr = new IterableString('asd')
		istr.advance()
		expect(istr.current()).toEqual('s')
		expect(istr.next()).toEqual('d')
	})

	it('can get the marked substring of a string', function () {
		const istr = new IterableString('asdfgh')
		istr.advance()
		istr.setMarker()
		istr.advance()
		istr.advance()
		expect(istr.getMarked()).toEqual('sd')
	})
})
