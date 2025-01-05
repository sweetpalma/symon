/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { Bot, EnumEntity, Shell } from 'symon';

const bot = new Bot({
	languages: ['en'],
});

bot.addEntity(
	new EnumEntity({
		label: 'insult',
		options: ['stupid', 'silly'],
	})
);

bot.addEntity(
	new EnumEntity({
		label: 'praise',
		options: ['smart', 'sweet'],
	})
);

bot.addDocument({
	intent: 'chatter/greeting',
	examples: ['hello', 'hi', 'good afternoon', 'good evening'],
	answers: ['Hello!'],
});

bot.addDocument({
	intent: 'chatter/parting',
	examples: ['goodbye', 'bye'],
	answers: ['Bye, asshole.'],
});

bot.addDocument({
	intent: 'chatter/insult',
	examples: ['you are %insult%', '%insult%'],
	answers: ['No, you are {{ insult }}!'],
});

bot.addDocument({
	intent: 'chatter/praise',
	examples: ['you are %praise%', '%insult%'],
	answers: ['Thanks!'],
});

bot.addDocument({
	intent: 'response/yes',
	examples: ['yes', 'yeah'],
});

bot.addDocument({
	intent: 'response/no',
	examples: ['no', 'nope'],
});

bot.addDocument({
	intent: 'random',
	examples: ['pick a random number', 'say a random number'],
	handler: async (ctx) => {
		const number = Math.floor(Math.random() * 5);
		await ctx.say({ answer: number.toString() });
	},
});

bot.addDocument({
	intent: 'terminate',
	examples: ['exit', 'stop yourself', 'kill yourself'],
	handler: async (ctx) => {
		const { intent } = await ctx.classify(await ctx.ask({ answer: 'Really?' }));
		if (intent === 'response/yes') {
			process.exit(0);
		} else {
			await ctx.say({ answer: 'Hooray!' });
		}
	},
});

bot.addMiddleware((req, res) => {
	if (!res.answer) {
		res.answer = `Sorry, I don't understand you.`;
	}
});

const cli = new Shell({ bot });
cli.start();
