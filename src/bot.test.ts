/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PorterStemmerUk } from './nlp';
import { Bot } from './bot';

describe('Bot', () => {
	it('fails to train a classifier without documents', async () => {
		const msg = 'Empty classifier could not be trained.';
		expect(() => new Bot().train()).toThrow(msg);
	});

	it('fails to process a message using an untrained classifier', async () => {
		const msg = 'Classifier is not trained.';
		expect(() => new Bot().process({ text: '', user: { id: '0' } })).rejects.toThrow(msg);
	});

	it('fails to add multiple documents with the same intent', async () => {
		const bot = new Bot();
		const msg = 'Document with intent "test" already exists.';
		bot.addDocument({ intent: 'test', examples: ['test'] });
		expect(() => bot.addDocument({ intent: 'test', examples: [] })).toThrow(msg);
	});
});

describe('Bot (English)', () => {
	let bot: Bot;
	const process = async (text: string, userId: string = '0') => {
		return bot.process({
			user: { id: userId },
			text,
		});
	};

	beforeEach(() => {
		bot = new Bot();
	});

	it('classifies documents', async () => {
		bot.addDocument({
			intent: 'insult',
			examples: ['you are bad', 'you are stupid'],
			answers: ['thanks'],
		});
		bot.addDocument({
			intent: 'praise',
			examples: ['you are good', 'you are nice'],
			answers: ['shame'],
		});
		bot.train();
		expect(await process('you are bad')).toMatchObject({ answer: 'thanks' });
		expect(await process('you are stupid')).toMatchObject({ answer: 'thanks' });
		expect(await process('you are good')).toMatchObject({ answer: 'shame' });
		expect(await process('you are nice')).toMatchObject({ answer: 'shame' });
		expect(await process('you are a bot')).toMatchObject({ answer: null });
		expect(await process('you are silly')).toMatchObject({ answer: null });
	});

	it('classifies entities', async () => {
		bot.addEntity({
			label: 'insult',
			options: ['asshole', 'idiot'],
		});
		bot.addEntity({
			label: 'praise',
			options: ['gentleman', 'based'],
		});
		bot.addDocument({
			intent: 'insult',
			examples: ['you are an %insult%'],
			answers: ['thanks'],
		});
		bot.addDocument({
			intent: 'praise',
			examples: ['you are an %praise%'],
			answers: ['shame'],
		});
		bot.train();
		expect(await process('you are an asshole')).toMatchObject({ answer: 'thanks' });
		expect(await process('you are an idiot')).toMatchObject({ answer: 'thanks' });
		expect(await process('you are a gentleman')).toMatchObject({ answer: 'shame' });
		expect(await process('you are based')).toMatchObject({ answer: 'shame' });
		expect(await process('you are a bot')).toMatchObject({ answer: null });
		expect(await process('you are silly')).toMatchObject({ answer: null });
	});

	it('classifies long input (single intent)', async () => {
		bot.addDocument({
			intent: 'insult',
			examples: ['you are bad', 'you are stupid'],
			answers: ['shame'],
		});
		bot.train();
		const input = 'Hello. I am John Doe, London city. You are stupid. And I am not';
		expect(await process(input)).toMatchObject({ answer: 'shame' });
	});

	it('classifies long input (multiple intent)', async () => {
		bot.addDocument({
			intent: 'insult',
			examples: ['you are bad', 'you are stupid'],
			answers: ['shame'],
		});
		bot.addDocument({
			intent: 'praise',
			examples: ['you are good', 'you are nice'],
			answers: ['thanks'],
		});
		bot.train();
		const input = 'You are bad. You are bad. You are good. You are bad';
		expect(await process(input)).toMatchObject({ answer: 'shame' });
	});
});

describe('Bot (Ukrainian)', () => {
	let bot: Bot;
	const process = async (text: string, userId: string = '0') => {
		return bot.process({
			user: { id: userId },
			text,
		});
	};

	beforeEach(() => {
		bot = new Bot({
			stemmer: PorterStemmerUk,
		});
	});

	it('classifies documents', async () => {
		bot.addDocument({
			intent: 'insult',
			examples: ['ти мудак', 'ти ідіот'],
			answers: ['пішов нахуй'],
		});
		bot.addDocument({
			intent: 'praise',
			examples: ['ти козак', 'ти базюк'],
			answers: ['дякую'],
		});
		bot.train();
		expect(await process('ти мудак')).toMatchObject({ answer: 'пішов нахуй' });
		expect(await process('ти ідіот')).toMatchObject({ answer: 'пішов нахуй' });
		expect(await process('ти козак')).toMatchObject({ answer: 'дякую' });
		expect(await process('ти базюк')).toMatchObject({ answer: 'дякую' });
		expect(await process('ти бабак')).toMatchObject({ answer: null });
		expect(await process('ти судак')).toMatchObject({ answer: null });
	});

	it('classifies entities', async () => {
		bot.addEntity({
			label: 'insult',
			options: ['мудак', 'ідіот'],
		});
		bot.addEntity({
			label: 'praise',
			options: ['козак', 'базюк'],
		});
		bot.addDocument({
			intent: 'insult',
			examples: ['ти %insult%', '%insult%'],
			answers: ['пішов нахуй'],
		});
		bot.addDocument({
			intent: 'praise',
			examples: ['ти %praise%', '%praise%'],
			answers: ['дякую'],
		});
		bot.train();
		expect(await process('ти мудак')).toMatchObject({ answer: 'пішов нахуй' });
		expect(await process('ти ідіот')).toMatchObject({ answer: 'пішов нахуй' });
		expect(await process('ти козак')).toMatchObject({ answer: 'дякую' });
		expect(await process('ти базюк')).toMatchObject({ answer: 'дякую' });
		expect(await process('ти бабак')).toMatchObject({ answer: null });
		expect(await process('ти дурак')).toMatchObject({ answer: null });
	});

	it('handles simple routines', async () => {
		bot.addDocument({
			intent: 'insult',
			examples: ['ти мудак', 'ти ідіот'],
			handler: async (ctx) => await ctx.say({ answer: 'пішов нахуй' }),
		});
		bot.addDocument({
			intent: 'praise',
			examples: ['ти козак', 'ти базюк'],
			handler: async (ctx) => await ctx.say({ answer: 'дякую' }),
		});
		bot.train();
		expect(await process('ти мудак')).toMatchObject({ answer: 'пішов нахуй' });
		expect(await process('ти ідіот')).toMatchObject({ answer: 'пішов нахуй' });
		expect(await process('ти козак')).toMatchObject({ answer: 'дякую' });
		expect(await process('ти базюк')).toMatchObject({ answer: 'дякую' });
		expect(await process('ти бабак')).toMatchObject({ answer: null });
		expect(await process('ти судак')).toMatchObject({ answer: null });
	});

	it('classifies long input (single intent)', async () => {
		bot.addDocument({
			intent: 'insult',
			examples: ['ти мудак', 'ти ідіот'],
			answers: ['пішов нахуй'],
		});
		bot.train();
		const input = 'Привіт. Я Микита Парасюк, місто Львів. Ти мудак. А я ні';
		expect(await process(input)).toMatchObject({ answer: 'пішов нахуй' });
	});

	it('classifies long input (multiple intents)', async () => {
		bot.addDocument({
			intent: 'insult',
			examples: ['ти мудак', 'ти ідіот'],
			answers: ['пішов нахуй'],
		});
		bot.addDocument({
			intent: 'praise',
			examples: ['ти козак', 'ти базюк'],
			answers: ['дякую'],
		});
		bot.train();
		const input = 'Ти мудак. Ти мудак. Ти козак. Ти мудак';
		expect(await process(input)).toMatchObject({ answer: 'пішов нахуй' });
	});

	it('handles complex routines (single user)', async () => {
		bot.addDocument({
			intent: 'acquaintance',
			examples: ['привіт'],
			handler: async (ctx) => {
				const name = await ctx.ask({ answer: 'Привіт, як тебе звуть?' });
				await ctx.say({ answer: `${name.text}... Гарне імʼя!` });
			},
		});
		bot.addDocument({
			intent: 'parting',
			examples: ['бувай'],
			answers: ['Бувай!'],
		});
		bot.train();
		expect(await process('Привіт')).toMatchObject({ answer: 'Привіт, як тебе звуть?' });
		expect(await process('Павлик')).toMatchObject({ answer: 'Павлик... Гарне імʼя!' });
		expect(await process('Бувай!')).toMatchObject({ answer: 'Бувай!' });
		expect(await process('Хрююю!')).toMatchObject({ answer: null });
	});

	it('handles complex routines (multiple users)', async () => {
		bot.addDocument({
			intent: 'acquaintance',
			examples: ['привіт'],
			handler: async (ctx) => {
				const name = await ctx.ask({ answer: 'Привіт, як тебе звуть?' });
				await ctx.say({ answer: `${name.text}... Гарне імʼя!` });
			},
		});
		bot.addDocument({
			intent: 'parting',
			examples: ['бувай'],
			answers: ['Бувай!'],
		});
		bot.train();
		expect(await process('Привіт', 'A')).toMatchObject({
			answer: 'Привіт, як тебе звуть?',
		});
		expect(await process('Привіт', 'B')).toMatchObject({
			answer: 'Привіт, як тебе звуть?',
		});
		expect(await process('Павлик', 'A')).toMatchObject({
			answer: 'Павлик... Гарне імʼя!',
		});
		expect(await process('Антоха', 'B')).toMatchObject({
			answer: 'Антоха... Гарне імʼя!',
		});
		expect(await process('Бувай!', 'A')).toMatchObject({ answer: 'Бувай!' });
		expect(await process('Бувай!', 'B')).toMatchObject({ answer: 'Бувай!' });
	});
});
