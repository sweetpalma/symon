/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { describe, it, expect } from 'vitest';
import { PorterStemmerUk } from '../nlp';
import { EnumEntity } from './enum';

describe('EnumEntity (English)', () => {
	it('extracts array entities', async () => {
		const entity = new EnumEntity({
			label: 'city',
			options: ['London', 'Paris'],
		});
		const { entities, template } = await entity.process('In Paris, in London');
		expect(template).toEqual('In %city%, in %city%');
		expect(entities).toMatchObject([
			{ label: 'city', option: 'Paris' },
			{ label: 'city', option: 'London' },
		]);
	});

	it('extracts record entities', async () => {
		const entity = new EnumEntity({
			label: 'city',
			options: {
				london: ['London'],
				paris: ['Paris'],
			},
		});
		const { entities, template } = await entity.process(
			"I'm in London, heading to Paris"
		);
		expect(template).toEqual("I'm in %city%, heading to %city%");
		expect(entities).toMatchObject([
			{ label: 'city', option: 'london' },
			{ label: 'city', option: 'paris' },
		]);
	});
});

describe('EnumEntity (Ukrainian)', () => {
	it('correctly uses both stemming and string distance to match entities', async () => {
		const entity = new EnumEntity({
			label: 'city',
			stemmer: PorterStemmerUk,
			options: ['вінниця'],
		});
		const match = async (str: string) => (await entity.search(str))[0];
		expect(await match('Вінниця')).not.toBeUndefined();
		expect(await match('Вінниці')).not.toBeUndefined();
		expect(await match('Вінницькі')).not.toBeUndefined();
		expect(await match('Вінницький')).not.toBeUndefined();
		expect(await match('Вінницьких')).not.toBeUndefined();
		expect(await match('Винник')).toBeUndefined();
		expect(await match('Віники')).toBeUndefined();
		expect(await match('Віник')).toBeUndefined();
	});

	it('extracts array entities', async () => {
		const entity = new EnumEntity({
			label: 'city',
			stemmer: PorterStemmerUk,
			options: ['Київ', 'Вінниця'],
		});
		const { entities, template } = await entity.process('У Києві, у Вінниці');
		expect(template).toEqual('У %city%, у %city%');
		expect(entities).toMatchObject([
			{ label: 'city', option: 'Київ' },
			{ label: 'city', option: 'Вінниця' },
		]);
	});

	it('extracts record entities', async () => {
		const entity = new EnumEntity({
			label: 'city',
			stemmer: PorterStemmerUk,
			options: {
				kyiv: ['Київ', 'Києв'],
				vinnytsya: ['Вінниця'],
			},
		});
		const { entities, template } = await entity.process(
			'Я в Києві, скоро буду у Вінниці'
		);
		expect(template).toEqual('Я в %city%, скоро буду у %city%');
		expect(entities).toMatchObject([
			{ label: 'city', option: 'kyiv' },
			{ label: 'city', option: 'vinnytsya' },
		]);
	});
});
