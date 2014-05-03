(function () {
	'use strict';

	function IterableString(string) {
		this.string = string;
		this.pointer = 0;
		this.marker = 0;

		this.line = 1;
		this.column = 1;
	}

	IterableString.prototype.advance = function () {
		if (this.current() === '\n') {
			this.line++;
			this.column = 1;
		} else {
			this.column++;
		}

		this.pointer++;
	};

	IterableString.prototype.setMarker = function () {
		this.marker = this.pointer;
	};

	IterableString.prototype.current = function () {
		return this.string.charAt(this.pointer);
	};

	IterableString.prototype.next = function () {
		return this.string.charAt(this.pointer + 1);
	};

	IterableString.prototype.hasNext = function () {
		return this.pointer < this.string.length;
	};

	IterableString.prototype.getMarked = function () {
		return this.string.substring(this.marker, this.pointer);
	};

	IterableString.prototype.getCoords = function () {
		return {
            line: this.line,
            column: this.column
        };
	};

    window.espace = window.espace || {};
    window.espace.IterableString = IterableString;
})();
