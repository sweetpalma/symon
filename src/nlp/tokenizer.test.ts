/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { describe, it, expect } from 'vitest';
import { WordTokenizer } from '.';

describe('WordTokenizer (English)', () => {
	const tokenizer = new WordTokenizer();

	it('parses strings with punctuation', () => {
		const input = 'My name is Petlyuryk.';
		expect(tokenizer.tokenize(input)).toEqual(['My', 'name', 'is', 'Petlyuryk']);
	});

	it('parses strings with apostrophes', () => {
		const input = "Petlyuryk - that's my name.";
		expect(tokenizer.tokenize(input)).toEqual(['Petlyuryk', "that's", 'my', 'name']);
	});

	it('parses strings with numbers', () => {
		const input = 'My version is 4.';
		expect(tokenizer.tokenize(input)).toEqual(['My', 'version', 'is', '4']);
	});
});

describe('WordTokenizer (Ukrainian)', () => {
	const tokenizer = new WordTokenizer();

	it('parses strings with punctuation', () => {
		const input = 'Мене звуть Петлюрик.';
		expect(tokenizer.tokenize(input)).toEqual(['Мене', 'звуть', 'Петлюрик']);
	});

	it('parses strings with apostrophes', () => {
		const input = "Моє ім'я - Петлюрик.";
		expect(tokenizer.tokenize(input)).toEqual(['Моє', "ім'я", 'Петлюрик']);
	});

	it('parses strings with numbers', () => {
		const input = 'Моя версія - 4.';
		expect(tokenizer.tokenize(input)).toEqual(['Моя', 'версія', '4']);
	});
});
