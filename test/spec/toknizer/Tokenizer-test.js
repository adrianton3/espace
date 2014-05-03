describe('Tokenizer', function () {
	var chop = espace.Tokenizer();

    it('can tokenize an empty string', function () {
        expect(chop('')).toEqual([]);
    });

    it('can tokenize a number', function () {
        expect(chop('0')).toEqual([{
			type: 'number',
			value: 0
        }]);

        expect(chop('1234')).toEqual([{
			type: 'number',
			value: 1234
        }]);
    });

	it('can tokenize a floating point number', function () {
        expect(chop('0.1')).toEqual([{
			type: 'number',
			value: 0.1
        }]);

        expect(chop('12.34')).toEqual([{
			type: 'number',
			value: 12.34
        }]);
    });


    it('can ignore whitespace', function () {
        expect(chop('  \n\t  ')).toEqual([]);
        expect(chop('\n  \n1234\t ')).toEqual([{
			type: 'number',
			value: 1234
        }]);
    });

    it('can tokenize an alphanum', function () {
        expect(chop('a1234')).toEqual([{
			type: 'alphanum',
			value: 'a1234'
        }]);
    });

    it('can tokenize a paren', function () {
        expect(chop('(')).toEqual([{
			type: '('
        }]);
        expect(chop(')')).toEqual([{
			type: ')'
        }]);
    });

    it('can tokenize a single line comment', function () {
        expect(chop(';')).toEqual([]);
        expect(chop(';comment')).toEqual([]);
        expect(chop(';;comment')).toEqual([]);
    });

    it('can tokenize a multi line comment', function () {
        expect(chop(';--;')).toEqual([]);
        expect(chop(';-asd\nasd-;')).toEqual([]);
    });
});
