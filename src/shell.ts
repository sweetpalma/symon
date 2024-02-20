/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { Interface, createInterface } from 'node:readline';
import { Bot, BotRequest } from './bot';

/**
 * Bot shell options.
 */
export interface ShellOptions {
	bot: Bot;
	output?: Parameters<typeof createInterface>[0]['output'];
	input?: Parameters<typeof createInterface>[0]['input'];
	debug?: boolean;
}

/**
 * Bot shell.
 */
export class Shell {
	private debug: boolean;
	public readonly cli: Interface;
	public readonly bot: Bot;

	constructor(opts: ShellOptions) {
		this.debug = opts.debug ?? false;
		this.bot = opts.bot;
		this.cli = createInterface({
			output: opts.output ?? process.stdout,
			input: opts.input ?? process.stdin,
		});
	}

	/**
	 * Prompts query to the active CLI and returns answer.
	 * @param query - Query text.
	 * @returns User answer.
	 */
	public async prompt(query: string = '') {
		return new Promise<string>((resolve) => {
			this.cli.question(query, resolve);
		});
	}

	/**
	 * Starts a new shell session.
	 * @remarks Bot is trained automatically.
	 */
	public async start() {
		if (!this.bot.isTrained) {
			this.bot.train();
		}
		while (true) {
			const text = await this.prompt(`User> `);
			const req: BotRequest = {
				user: { id: 'user' },
				text,
			};
			const { answer, ...cls } = await this.bot.process(req);
			if (this.debug) {
				console.log(`Bot> ${answer}`);
				console.log();
			} else {
				console.log(`Bot> ${answer}`);
				console.log(JSON.stringify(cls, undefined, 2));
				console.log();
			}
		}
	}
}
