/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { Bot, Shell, PorterStemmerUk } from 'symon';

const bot = new Bot({
	stemmer: PorterStemmerUk,
});

bot.addEntity({
	label: 'insult',
	options: ['ідіот', 'мудак', 'дурень'],
});

bot.addEntity({
	label: 'praise',
	options: ['хороший', 'сонечко'],
});

bot.addDocument({
	intent: 'chatter/hello',
	examples: ['привіт', 'хай', 'добрий вечір', 'добрий ранок'],
	answers: ['Привіт!'],
});

bot.addDocument({
	intent: 'chatter/bye',
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

bot.addMiddleware((req, res) => {
	if (!res.answer) {
		res.answer = `Вибач, я не розумію.`;
	}
});

const cli = new Shell({ bot });
bot.train();
cli.start();
