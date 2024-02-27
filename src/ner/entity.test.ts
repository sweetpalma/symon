/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { EntityManager } from './entity';
import { RegexpEntity } from './regexp';

describe('RegexpEntity', () => {
	let entityManager: EntityManager;

	beforeEach(() => {
		entityManager = new EntityManager();
	});

	it('fails to add multiple entities with the same label', async () => {
		expect(() =>
			entityManager.addEntity(
				new RegexpEntity({
					label: 'test',
					match: /test+/g,
				})
			)
		).not.toThrow();
		expect(() =>
			entityManager.addEntity(
				new RegexpEntity({
					label: 'test',
					match: /test+/g,
				})
			)
		).toThrow();
	});

	it('processes non-overlapping RegExp entities', async () => {
		entityManager.addEntity(
			new RegexpEntity({
				label: 'a',
				match: /a+/g,
			})
		);
		entityManager.addEntity(
			new RegexpEntity({
				label: 'b',
				match: /b+/g,
			})
		);
		expect(await entityManager.process('aaa bb aaa')).toEqual({
			template: '%a% %b% %a%',
			entities: [
				expect.objectContaining({
					label: 'a',
					source: 'aaa',
					index: 0,
				}),
				expect.objectContaining({
					label: 'b',
					source: 'bb',
					index: 4,
				}),
				expect.objectContaining({
					label: 'a',
					source: 'aaa',
					index: 7,
				}),
			],
		});
	});

	it('processes overlapping RegExp entities', async () => {
		entityManager.addEntity(
			new RegexpEntity({
				label: 'a',
				match: /a{2,}/g,
			})
		);
		entityManager.addEntity(
			new RegexpEntity({
				label: 'ab',
				match: /ab/g,
			})
		);
		expect(await entityManager.process('aaab ab')).toEqual({
			template: '%a%b %ab%',
			entities: [
				expect.objectContaining({
					label: 'a',
					source: 'aaa',
					index: 0,
				}),
				expect.objectContaining({
					label: 'ab',
					source: 'ab',
					index: 5,
				}),
			],
		});
	});
});
