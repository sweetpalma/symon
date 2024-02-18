/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { describe, it, expect } from 'vitest';
import testCases from '../data/test-stems.json';
import { PorterStemmerUk as stemmer } from '.';

const ACCEPTABLE_PASS_RATE = 0.95;

describe('Stemmer (Ukrainian)', () => {
	it('starts the stemming after the first vowel', () => {
		const shortWord = 'рим';
		expect(stemmer.stem(shortWord)).toBe(shortWord);
	});

	it(`passes ${ACCEPTABLE_PASS_RATE * 100}% of test cases`, () => {
		const passedCases = testCases.filter(([i, s]) => stemmer.stem(i!) === s!);
		const passRate = passedCases.length / testCases.length;
		expect(passRate).toBeGreaterThan(ACCEPTABLE_PASS_RATE);
	});
});
