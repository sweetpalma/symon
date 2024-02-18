/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { describe, it, expect } from 'vitest';
import { Language } from '.';

describe('Language', () => {
	let language = new Language();

	it('detects existing language', () => {
		expect(language.process('привет')).toMatchObject({ language: 'ru' });
		expect(language.process('привіт')).toMatchObject({ language: 'uk' });
		expect(language.process('hello!')).toMatchObject({ language: 'en' });
	});

	it('detects unknown language', () => {
		expect(language.process('asd ds')).toMatchObject({ language: 'un' });
	});
});
