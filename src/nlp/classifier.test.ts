/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Classifier } from './classifier';

describe('Classifier', () => {
	it('fails to train a classifier without documents', async () => {
		const msg = 'Empty classifier could not be trained.';
		expect(() => new Classifier().train()).toThrow(msg);
	});

	it('fails to accept an empty document', async () => {
		const msg = 'No examples were provided.';
		expect(() => new Classifier().addDocument({ intent: '', examples: [] })).toThrow(msg);
	});

	it('fails to process a text using an untrained classifier', async () => {
		const msg = 'Classifier is not trained.';
		expect(() => new Classifier().classify('test')).rejects.toThrow(msg);
	});

	it('is serializable', async () => {
		const original = new Classifier();
		original.addDocument({
			intent: 'a',
			examples: ['a'],
		});
		original.addDocument({
			intent: 'b',
			examples: ['b'],
		});
		original.train();
		expect(await original.classifyText('a')).toMatchObject([{ intent: 'a' }]);
		expect(await original.classifyText('b')).toMatchObject([{ intent: 'b' }]);
		const restored = new Classifier().load(original.save());
		expect(await restored.classifyText('a')).toMatchObject([{ intent: 'a' }]);
		expect(await restored.classifyText('b')).toMatchObject([{ intent: 'b' }]);
	});
});

describe('Classifier (English)', () => {
	let classifier: Classifier;
	const process = async (text: string) => {
		const [head] = await classifier.classifyText(text);
		return head;
	};

	beforeEach(() => {
		classifier = new Classifier({
			languages: ['en'],
		});
	});

	it('classifies different intents', async () => {
		classifier.addDocument({
			intent: 'insult',
			examples: ['you are bad', 'you are stupid'],
		});
		classifier.addDocument({
			intent: 'praise',
			examples: ['you are good', 'you are nice'],
		});
		classifier.train();
		expect(await process('You are bad')).toMatchObject({ intent: 'insult' });
		expect(await process('You are stupid')).toMatchObject({ intent: 'insult' });
		expect(await process('You are good')).toMatchObject({ intent: 'praise' });
		expect(await process('You are nice')).toMatchObject({ intent: 'praise' });
		expect(await process('you are a bot')).toBeUndefined();
		expect(await process('you are silly')).toBeUndefined();
	});

	it('classifies similar intents', async () => {
		classifier.addDocument({
			intent: 'insult/bot',
			examples: ['you are bad', 'you are an idiot'],
		});
		classifier.addDocument({
			intent: 'insult/self',
			examples: ['i am bad', 'i am an idiot'],
		});
		classifier.train();
		expect(await process('You are bad')).toMatchObject({ intent: 'insult/bot' });
		expect(await process('You are an idiot')).toMatchObject({ intent: 'insult/bot' });
		expect(await process('I am bad')).toMatchObject({ intent: 'insult/self' });
		expect(await process('I am an idiot')).toMatchObject({ intent: 'insult/self' });
	});

	it('classifies long input (single intent)', async () => {
		classifier.addDocument({
			intent: 'insult',
			examples: ['you are bad', 'you are stupid'],
		});
		classifier.train();
		const input = 'Hello. I am John Doe, London city. You are stupid. And I am not';
		expect(await classifier.classifyText(input)).toEqual([
			expect.objectContaining({
				intent: 'insult',
				language: 'en',
			}),
		]);
	});

	it('classifies long input (multiple intent)', async () => {
		classifier.addDocument({
			intent: 'insult',
			examples: ['you are bad', 'you are stupid'],
		});
		classifier.addDocument({
			intent: 'praise',
			examples: ['you are good', 'you are nice'],
		});
		classifier.train();
		const input = 'You are bad. You are bad. You are good. You are bad';
		expect(await classifier.classifyText(input)).toEqual([
			expect.objectContaining({
				intent: 'insult',
				language: 'en',
				score: 0.75,
			}),
			expect.objectContaining({
				intent: 'praise',
				language: 'en',
				score: 0.25,
			}),
		]);
	});

	it('classifies long input (really long)', async () => {
		classifier.addDocument({
			intent: 'insult',
			examples: ['you are bad', 'you are stupid'],
		});
		classifier.train();
		const input = new Array(1024).fill('You are bad').join('.');
		expect(await classifier.classifyText(input)).toEqual([
			expect.objectContaining({
				intent: 'insult',
				language: 'en',
			}),
		]);
	});
});

describe('Classifier (Ukrainian)', () => {
	let classifier: Classifier;
	const process = async (input: string) => {
		const [top] = await classifier.classify(input);
		return top;
	};

	beforeEach(() => {
		classifier = new Classifier({
			languages: ['uk'],
		});
	});

	it('classifies different intents', async () => {
		classifier.addDocument({
			intent: 'insult',
			examples: ['ти мудак', 'ти ідіот', 'мудак', 'ідіот'],
		});
		classifier.addDocument({
			intent: 'praise',
			examples: ['ти козак', 'ти базюк', 'козак', 'базюк'],
		});
		classifier.train();
		expect(await process('Ти козак')).toMatchObject({ intent: 'praise' });
		expect(await process('Ти базюк')).toMatchObject({ intent: 'praise' });
		expect(await process('Ти мудак')).toMatchObject({ intent: 'insult' });
		expect(await process('Ти ідіот')).toMatchObject({ intent: 'insult' });
		expect(await process('ти бабак')).toBeUndefined();
		expect(await process('ти судак')).toBeUndefined();
	});

	it('classifies similar intents', async () => {
		classifier.addDocument({
			intent: 'insult/bot',
			examples: ['ти мудак', 'ти ідіот', 'ти дебіл'],
			language: 'uk',
		});
		classifier.addDocument({
			intent: 'insult/self',
			examples: ['я мудак', 'я ідіот', 'я дебіл'],
			language: 'uk',
		});
		classifier.train();
		expect(await process('Ти мудак')).toMatchObject({ intent: 'insult/bot' });
		expect(await process('Ти ідіот')).toMatchObject({ intent: 'insult/bot' });
		expect(await process('Я мудак')).toMatchObject({ intent: 'insult/self' });
		expect(await process('Я ідіот')).toMatchObject({ intent: 'insult/self' });
	});

	it('classifies long input (single intent)', async () => {
		classifier.addDocument({
			intent: 'insult',
			examples: ['ти мудак', 'ти ідіот'],
		});
		classifier.train();
		const input = 'Привіт. Я Микита Парасюк, місто Львів. Ти мудак. А я ні';
		expect(await classifier.classifyText(input)).toEqual([
			expect.objectContaining({
				intent: 'insult',
				language: 'uk',
			}),
		]);
	});

	it('classifies long input (multiple intents)', async () => {
		classifier.addDocument({
			intent: 'insult',
			examples: ['ти мудак', 'ти ідіот'],
		});
		classifier.addDocument({
			intent: 'praise',
			examples: ['ти козак', 'ти базюк'],
		});
		classifier.train();
		const input = 'Ти мудак. Ти мудак. Ти козак. Ти мудак';
		expect(await classifier.classifyText(input)).toEqual([
			expect.objectContaining({
				intent: 'insult',
				language: 'uk',
			}),
			expect.objectContaining({
				intent: 'praise',
				language: 'uk',
			}),
		]);
	});

	it('classifies long input (really long)', async () => {
		classifier.addDocument({
			intent: 'insult',
			examples: ['ти мудак', 'ти ідіот'],
		});
		classifier.train();
		const input = new Array(1024).fill('Ти мудак').join('.');
		expect(await classifier.classifyText(input)).toEqual([
			expect.objectContaining({
				intent: 'insult',
				language: 'uk',
			}),
		]);
	});
});

describe('Classifier (Multi)', () => {
	let classifier: Classifier;
	const process = async (input: string) => {
		const [top] = await classifier.classify(input);
		return top;
	};

	beforeEach(() => {
		classifier = new Classifier({
			languages: ['uk', 'ru'],
		});
	});

	it('classifies same intents for different languages', async () => {
		classifier.addDocument({
			language: 'ru',
			intent: 'greeting',
			examples: ['привет'],
		});
		classifier.addDocument({
			language: 'uk',
			intent: 'greeting',
			examples: ['привіт'],
		});
		classifier.train();
		expect(await process('Привіт')).toMatchObject({ language: 'uk' });
		expect(await process('Привет')).toMatchObject({ language: 'ru' });
	});
});
