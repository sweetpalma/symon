/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PorterStemmer, PorterStemmerUk, AggressiveTokenizer, EntityManager } from '.';

describe('Entity', () => {
	let manager: EntityManager;

	beforeEach(() => {
		manager = new EntityManager();
	});

	it('stores entities', () => {
		manager.addEntity({ label: 'testA', options: { a: ['a'] } });
		manager.addEntity({ label: 'testB', options: { b: ['b'] } });
		expect(manager.getEntity('testA')).toHaveProperty('options', { a: ['a'] });
		expect(manager.getEntity('testB')).toHaveProperty('options', { b: ['b'] });
	});

	it('throws error if entity with such label already exists', () => {
		manager.addEntity({ label: 'test', options: { a: ['a'] } });
		expect(() => manager.addEntity({ label: 'test', options: {} })).toThrow();
	});
});

describe('Entity (English)', () => {
	let manager: EntityManager;

	beforeEach(() => {
		manager = new EntityManager({
			tokenizer: new AggressiveTokenizer(),
			stemmer: PorterStemmer,
		});
	});

	it('correctly uses both stemming and string distance to match entities', () => {
		manager.addEntity({ label: 'city', options: ['london'] });
		const match = manager.match.bind(manager);
		expect(match('London')).not.toBeUndefined();
		expect(match("London's")).not.toBeUndefined();
		expect(match('Londoner')).not.toBeUndefined();
		expect(match('Undon')).toBeUndefined();
	});

	it('extracts array entities', () => {
		manager.addEntity({
			label: 'city',
			options: ['London', 'Paris'],
		});
		const { entities, template } = manager.process('In Paris, in London');
		expect(template).toEqual('In %city%, in %city%');
		expect(entities).toMatchObject([
			{ label: 'city', option: 'Paris' },
			{ label: 'city', option: 'London' },
		]);
	});

	it('extracts record entities', () => {
		manager.addEntity({
			label: 'city',
			options: {
				london: ['London'],
				paris: ['Paris'],
			},
		});
		const { entities, template } = manager.process("I'm in London, heading to Paris");
		expect(template).toEqual("I'm in %city%, heading to %city%");
		expect(entities).toMatchObject([
			{ label: 'city', option: 'london' },
			{ label: 'city', option: 'paris' },
		]);
	});
});

describe('Entity (Ukrainian)', () => {
	let manager: EntityManager;

	beforeEach(() => {
		manager = new EntityManager({
			stemmer: PorterStemmerUk,
		});
	});

	it('correctly uses both stemming and string distance to match entities', () => {
		manager.addEntity({ label: 'city', options: ['вінниця'] });
		const match = manager.match.bind(manager);
		expect(match('Вінниця')).not.toBeUndefined();
		expect(match('Вінниці')).not.toBeUndefined();
		expect(match('Вінницькі')).not.toBeUndefined();
		expect(match('Вінницький')).not.toBeUndefined();
		expect(match('Вінницьких')).not.toBeUndefined();
		expect(match('Винник')).toBeUndefined();
		expect(match('Віники')).toBeUndefined();
		expect(match('Віник')).toBeUndefined();
	});

	it('extracts array entities', () => {
		manager.addEntity({
			label: 'city',
			options: ['Київ', 'Вінниця'],
		});
		const { entities, template } = manager.process('У Києві, у Вінниці');
		expect(template).toEqual('У %city%, у %city%');
		expect(entities).toMatchObject([
			{ label: 'city', option: 'Київ' },
			{ label: 'city', option: 'Вінниця' },
		]);
	});

	it('extracts record entities', () => {
		manager.addEntity({
			label: 'city',
			options: {
				kyiv: ['Київ', 'Києв'],
				vinnytsya: ['Вінниця'],
			},
		});
		const { entities, template } = manager.process('Я в Києві, скоро буду у Вінниці');
		expect(template).toEqual('Я в %city%, скоро буду у %city%');
		expect(entities).toMatchObject([
			{ label: 'city', option: 'kyiv' },
			{ label: 'city', option: 'vinnytsya' },
		]);
	});
});
