/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { Bot, Shell, EnumEntity } from 'symon';

const bot = new Bot({
	languages: ['uk'],
});

bot.addEntity(
	new EnumEntity({
		label: 'praise',
		options: ['хороший', 'сонечко', 'добрий'],
	})
);

bot.addEntity(
	new EnumEntity({
		label: 'insult',
		options: ['ідіот', 'мудак', 'дурень'],
	})
);

bot.addDocument({
	intent: 'chatter/greeting',
	examples: ['привіт', 'хай', 'добрий вечір', 'добрий ранок'],
	answers: ['Привіт!'],
});

bot.addDocument({
	intent: 'chatter/parting',
	examples: ['бувай', 'прощавай'],
	answers: ['Бувай!'],
});

bot.addDocument({
	intent: 'chatter/insult',
	examples: ['Ти %insult%', '%insult%'],
	answers: ['Йди нахуй.'],
});

bot.addDocument({
	intent: 'chatter/praise',
	examples: ['Ти %praise%', '%praise%'],
	answers: ['Дякую!'],
});

bot.addDocument({
	intent: 'response/yes',
	examples: ['так', 'ага'],
});

bot.addDocument({
	intent: 'response/no',
	examples: ['ні', 'нє'],
});

bot.addDocument({
	intent: 'random',
	examples: ['випадкове число', 'скажи рандомне число'],
	handler: async (ctx) => {
		const number = Math.floor(Math.random() * 5);
		await ctx.say({ answer: number.toString() });
	},
});

bot.addDocument({
	intent: 'suicide',
	examples: ['запетлися', 'вбий себе'],
	handler: async (ctx) => {
		const { intent } = await ctx.classify(await ctx.ask({ answer: 'Справді?' }));
		if (intent === 'response/yes') {
			process.exit(0);
		} else {
			await ctx.say({ answer: 'Ура!' });
		}
	},
});

bot.addMiddleware((req, res) => {
	if (!res.answer) {
		res.answer = `Вибач, я не розумію.`;
	}
});

const cli = new Shell({ bot });
cli.start();
