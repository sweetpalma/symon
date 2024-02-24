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
	debug?: boolean;
	output?: Parameters<typeof createInterface>[0]['output'];
	input?: Parameters<typeof createInterface>[0]['input'];
	promptUsr?: string;
	promptBot?: string;
}

/**
 * Bot shell.
 */
export class Shell {
	public readonly cli: Interface;
	public readonly bot: Bot;

	constructor(private readonly opts: ShellOptions) {
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
		const promptUsr = this.opts.promptUsr ?? 'Human>';
		const promptBot = this.opts.promptBot ?? 'Symon>';
		while (true) {
			const text = await this.prompt(promptUsr + ' ');
			const req: BotRequest = {
				user: { id: 'user' },
				text,
			};
			const { answer, ...cls } = await this.bot.process(req);
			if (!this.opts.debug) {
				console.log([promptBot, answer].join(' '));
				console.log();
			} else {
				console.log([promptBot, answer].join(' '));
				console.log(JSON.stringify(cls, undefined, 2));
				console.log();
			}
		}
	}
}
