describe('IterableString', function () {
    it('can get the current character', function () {
		var istr = new sep.IterableString('asd');
        expect(istr.current()).toEqual('a');
    });

    it('can get the next character', function () {
		var istr = new sep.IterableString('asd');
        expect(istr.next()).toEqual('s');
    });

    it('can advance the pointer', function () {
		var istr = new sep.IterableString('asd');
		istr.advance();
        expect(istr.current()).toEqual('s');
        expect(istr.next()).toEqual('d');
    });

    it('can get the marked substring of a string', function () {
		var istr = new sep.IterableString('asdfgh');
		istr.advance();
		istr.setMarker();
		istr.advance();
		istr.advance();
		expect(istr.getMarked()).toEqual('sd');
    });
});
