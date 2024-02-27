/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { describe, it, expect } from 'vitest';
import { RegexpEntity } from './regexp';

describe('RegexpEntity', () => {
	it('fails to construct without a global flag', () => {
		const msg = 'RegexpEntity pattern must have a global flag.';
		expect(() => new RegexpEntity({ label: 'test', match: /test/ })).toThrow(msg);
	});

	it('matches simple regular expressions', async () => {
		const entity = new RegexpEntity({
			label: 'test',
			match: /a+/gi,
		});
		expect(await entity.process('aaa bb aa')).toEqual({
			template: '%test% bb %test%',
			entities: [
				expect.objectContaining({
					source: 'aaa',
					index: 0,
				}),
				expect.objectContaining({
					source: 'aa',
					index: 7,
				}),
			],
		});
		expect(await entity.process('bb aaa bb')).toEqual({
			template: 'bb %test% bb',
			entities: [
				expect.objectContaining({
					source: 'aaa',
					index: 3,
				}),
			],
		});
		expect(await entity.process('aaa aaa a')).toEqual({
			template: '%test% %test% %test%',
			entities: [
				expect.objectContaining({
					source: 'aaa',
					index: 0,
				}),
				expect.objectContaining({
					source: 'aaa',
					index: 4,
				}),
				expect.objectContaining({
					source: 'a',
					index: 8,
				}),
			],
		});
		expect(await entity.process('bbb bab b')).toMatchObject({
			template: 'bbb b%test%b b',
			entities: [
				expect.objectContaining({
					source: 'a',
					index: 5,
				}),
			],
		});
	});

	it('matches grouped regular expressions', async () => {
		const entity = new RegexpEntity({
			label: 'test',
			match: /(петлюрик)у?/gi,
		});
		expect(await entity.process('Петлюрик ти молодець')).toEqual({
			template: '%test% ти молодець',
			entities: [
				expect.objectContaining({
					source: 'Петлюрик',
					option: 'Петлюрик',
				}),
			],
		});
		expect(await entity.process('Петлюрику, ти лох')).toEqual({
			template: '%test%, ти лох',
			entities: [
				expect.objectContaining({
					source: 'Петлюрику',
					option: 'Петлюрик',
				}),
			],
		});
	});
});
