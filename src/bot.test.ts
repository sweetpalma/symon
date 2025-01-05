/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { EnumEntity } from './ner';
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
		bot = new Bot({
			languages: ['en'],
		});
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
		expect(await process('you are bad')).toMatchObject({
			answer: 'thanks',
		});
		expect(await process('you are stupid')).toMatchObject({
			answer: 'thanks',
		});
		expect(await process('you are good')).toMatchObject({
			answer: 'shame',
		});
		expect(await process('you are nice')).toMatchObject({
			answer: 'shame',
		});
		expect(await process('you are a bot')).toMatchObject({
			answer: null,
		});
		expect(await process('you are silly')).toMatchObject({
			answer: null,
		});
	});

	it('classifies entities', async () => {
		bot.addEntity(
			new EnumEntity({
				label: 'insult',
				options: ['asshole', 'idiot', 'bad'],
			})
		);
		bot.addEntity(
			new EnumEntity({
				label: 'praise',
				options: ['gentleman', 'based', 'good'],
			})
		);
		bot.addDocument({
			intent: 'insult',
			examples: ['you are an %insult%', '%insult%'],
			answers: ['shame'],
		});
		bot.addDocument({
			intent: 'praise',
			examples: ['you are an %praise%', '%praise%'],
			answers: ['thanks'],
		});
		bot.addDocument({
			intent: 'greeting',
			examples: ['good evening', 'good afternoon'],
			answers: ['hello'],
		});
		bot.train();
		expect(await process('good evening')).toMatchObject({
			answer: 'hello',
		});
		expect(await process('good afternoon')).toMatchObject({
			answer: 'hello',
		});
		expect(await process('you are a gentleman')).toMatchObject({
			answer: 'thanks',
		});
		expect(await process('you are based')).toMatchObject({
			answer: 'thanks',
		});
		expect(await process('you are good')).toMatchObject({
			answer: 'thanks',
		});
		expect(await process('you are an asshole')).toMatchObject({
			answer: 'shame',
		});
		expect(await process('you are an idiot')).toMatchObject({
			answer: 'shame',
		});
		expect(await process('you are bad')).toMatchObject({
			answer: 'shame',
		});
		expect(await process('you are a bot')).toMatchObject({
			answer: null,
		});
		expect(await process('you are silly')).toMatchObject({
			answer: null,
		});
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
			languages: ['uk'],
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
		expect(await process('ти мудак')).toMatchObject({
			answer: 'пішов нахуй',
		});
		expect(await process('ти ідіот')).toMatchObject({
			answer: 'пішов нахуй',
		});
		expect(await process('ти козак')).toMatchObject({
			answer: 'дякую',
		});
		expect(await process('ти базюк')).toMatchObject({
			answer: 'дякую',
		});
		expect(await process('ти бабак')).toMatchObject({
			answer: null,
		});
		expect(await process('ти судак')).toMatchObject({
			answer: null,
		});
	});

	it('classifies entities', async () => {
		bot.addEntity(
			new EnumEntity({
				label: 'insult',
				options: ['мудак', 'ідіот', 'поганий'],
			})
		);
		bot.addEntity(
			new EnumEntity({
				label: 'praise',
				options: ['козак', 'базюк', 'добрий'],
			})
		);
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
		bot.addDocument({
			intent: 'greeting',
			examples: ['добрий вечір', 'добрий день'],
			answers: ['привіт'],
		});
		bot.train();
		expect(await process('добрий день')).toMatchObject({
			answer: 'привіт',
		});
		expect(await process('добрий вечір')).toMatchObject({
			answer: 'привіт',
		});
		expect(await process('ти поганий')).toMatchObject({
			answer: 'пішов нахуй',
		});
		expect(await process('ти мудак')).toMatchObject({
			answer: 'пішов нахуй',
		});
		expect(await process('ти ідіот')).toMatchObject({
			answer: 'пішов нахуй',
		});
		expect(await process('ти добрий')).toMatchObject({
			answer: 'дякую',
		});
		expect(await process('ти козак')).toMatchObject({
			answer: 'дякую',
		});
		expect(await process('ти базюк')).toMatchObject({
			answer: 'дякую',
		});
		expect(await process('ти бабак')).toMatchObject({
			answer: null,
		});
		expect(await process('ти дурак')).toMatchObject({
			answer: null,
		});
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
		expect(await process('ти мудак')).toMatchObject({
			answer: 'пішов нахуй',
		});
		expect(await process('ти ідіот')).toMatchObject({
			answer: 'пішов нахуй',
		});
		expect(await process('ти козак')).toMatchObject({
			answer: 'дякую',
		});
		expect(await process('ти базюк')).toMatchObject({
			answer: 'дякую',
		});
		expect(await process('ти бабак')).toMatchObject({
			answer: null,
		});
		expect(await process('ти судак')).toMatchObject({
			answer: null,
		});
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
			intent: 'greeting',
			examples: ['привіт'],
			handler: async (ctx) => {
				if (ctx.store.name) {
					await ctx.say({ answer: `Привіт, ${ctx.store.name}!` });
				} else {
					ctx.store.name = (await ctx.ask({ answer: 'Привіт, як тебе звуть?' })).text;
					await ctx.say({ answer: `${ctx.store.name}... Я запамʼятаю!` });
				}
			},
		});
		bot.addDocument({
			intent: 'parting',
			examples: ['бувай'],
			answers: ['Бувай!'],
		});
		bot.train();
		expect(await process('Привіт')).toMatchObject({
			answer: 'Привіт, як тебе звуть?',
		});
		expect(await process('Павлик')).toMatchObject({
			answer: 'Павлик... Я запамʼятаю!',
		});
		expect(await process('Привіт')).toMatchObject({
			answer: 'Привіт, Павлик!',
		});
		expect(await process('Бувай!')).toMatchObject({
			answer: 'Бувай!',
		});
	});

	it('handles complex routines (multiple users)', async () => {
		bot.addDocument({
			intent: 'greeting',
			examples: ['привіт'],
			handler: async (ctx) => {
				if (ctx.store.name) {
					await ctx.say({ answer: `Привіт, ${ctx.store.name}!` });
				} else {
					ctx.store.name = (await ctx.ask({ answer: 'Привіт, як тебе звуть?' })).text;
					await ctx.say({ answer: `${ctx.store.name}... Я запамʼятаю!` });
				}
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
			answer: 'Павлик... Я запамʼятаю!',
		});
		expect(await process('Антоха', 'B')).toMatchObject({
			answer: 'Антоха... Я запамʼятаю!',
		});
		expect(await process('Привіт', 'A')).toMatchObject({
			answer: 'Привіт, Павлик!',
		});
		expect(await process('Привіт', 'B')).toMatchObject({
			answer: 'Привіт, Антоха!',
		});
		expect(await process('Бувай!', 'A')).toMatchObject({
			answer: 'Бувай!',
		});
		expect(await process('Бувай!', 'B')).toMatchObject({
			answer: 'Бувай!',
		});
	});

	it('handles nested classifications', async () => {
		bot.addDocument({
			intent: 'response/yes',
			examples: ['так', 'йес', 'да'],
		});
		bot.addDocument({
			intent: 'response/no',
			examples: ['ні', 'нє', 'ноу'],
		});
		bot.addDocument({
			intent: 'suicide',
			examples: ['запетлися'],
			handler: async (ctx) => {
				const { intent } = await ctx.classify(await ctx.ask({ answer: 'Точно?' }));
				switch (intent) {
					case 'response/yes': {
						await ctx.say({ answer: '* помирає *' });
						break;
					}
					case 'response/no': {
						await ctx.say({ answer: 'Ура!' });
						break;
					}
					default: {
						await ctx.say({ answer: 'Я не розумію...' });
					}
				}
			},
		});
		bot.train();
		expect(await process('Запетлися')).toMatchObject({ answer: 'Точно?' });
		expect(await process('Ні')).toMatchObject({ answer: 'Ура!' });
		expect(await process('Запетлися')).toMatchObject({ answer: 'Точно?' });
		expect(await process('Йес')).toMatchObject({ answer: '* помирає *' });
		expect(await process('Запетлися')).toMatchObject({ answer: 'Точно?' });
		expect(await process('Хрю')).toMatchObject({ answer: 'Я не розумію...' });
	});
});

describe('Bot (Multi-language)', () => {
	let bot: Bot;
	const process = async (text: string, userId: string = '0') => {
		return bot.process({
			user: { id: userId },
			text,
		});
	};

	beforeEach(() => {
		bot = new Bot({
			languages: ['uk', 'ru'],
		});
	});

	it('classifies documents', async () => {
		bot.addDocument({
			language: 'uk',
			intent: 'greeting',
			examples: ['Привіт'],
		});
		bot.addDocument({
			language: 'ru',
			intent: 'greeting',
			examples: ['Привет'],
		});
		bot.train();
		expect(await process('Привіт!')).toMatchObject({ language: 'uk' });
		expect(await process('Привет!')).toMatchObject({ language: 'ru' });
	});
});
