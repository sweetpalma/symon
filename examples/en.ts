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
		label: 'praise',
		options: ['smart', 'sweet', 'good'],
	})
);

bot.addEntity(
	new EnumEntity({
		label: 'insult',
		options: ['stupid', 'silly', 'bad'],
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
	answers: ['Sorry...'],
});

bot.addDocument({
	intent: 'chatter/praise',
	examples: ['you are %praise%', '%praise%'],
	answers: ['Thanks!'],
});

bot.addMiddleware((req, res) => {
	if (!res.answer) {
		res.answer = `Sorry, I don't understand you.`;
	}
});

const cli = new Shell({ bot });
cli.start();
