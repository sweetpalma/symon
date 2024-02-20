/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { Bot, Shell } from 'symon';

const bot = new Bot();

bot.addEntity({
	label: 'insult',
	options: ['retarded', 'stupid', 'bad'],
});

bot.addEntity({
	label: 'praise',
	options: ['good', 'nice'],
});

bot.addDocument({
	intent: 'chatter/hello',
	examples: ['hello', 'hi', 'good afternoon', 'good morning', 'good evening'],
	answers: ['Hello!'],
});

bot.addDocument({
	intent: 'chatter/bye',
	examples: ['bye', 'goodbye'],
	answers: ['Bye!'],
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

const cli = new Shell({ bot, debug: true });
bot.train();
cli.start();
