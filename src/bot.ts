/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { sample } from 'lodash';
import { JsonObject } from 'type-fest';
import AsyncLock from 'async-lock';
import { detect } from 'tinyld';
import { Classifier, ClassifierDocument, ClassifierMatch } from './nlp';
import { Entity, EntityMatch, EntityManager } from './ner';
import { Routine } from './routine';

/**
 * Bot learning sample.
 */
export interface BotDocument extends ClassifierDocument {
	answers?: Array<string>;
	handler?: BotHandler;
}

/**
 * Bot processing request.
 */
export interface BotRequest {
	text: string;
	user: {
		id: string;
	};
}

/**
 * Bot processing response.
 */
export interface BotResponse {
	language: string | null;
	intent: string | null;
	answer: string | null;
	classifications: Array<ClassifierMatch>;
	entities: Array<EntityMatch>;
}

/**
 * Bot context.
 */
export interface BotContext {
	bot: Bot;
	req: BotRequest;
	classifications: Array<ClassifierMatch>;
	entities: Array<EntityMatch>;
	store: JsonObject;
	classify: (req: BotRequest) => Promise<BotResponse>;
	ask: (res: Partial<BotResponse>) => Promise<BotRequest>;
	say: (res: Partial<BotResponse>) => Promise<void>;
}

/**
 * Bot middleware.
 */
export interface BotMiddleware {
	(this: Bot, req: BotRequest, res: BotResponse, stop: () => void): void | Promise<void>;
}

/**
 * Bot handler.
 */
export interface BotHandler {
	(this: Bot, ctx: BotContext): Promise<void>;
}

/**
 * Bot handler routine.
 * @internal
 */
// prettier-ignore
export type BotRoutine = (
	Routine<BotRequest, BotResponse>
);

/**
 * Bot options.
 */
export interface BotOptions {
	languages?: Array<string>;
	minThreshold?: number;
	minDeviation?: number;
}

/**
 * Bot error.
 */
export class BotError extends Error {
	constructor(message: string) {
		super(message);
	}
}

/**
 * Bot.
 */
export class Bot {
	public entityManager: EntityManager;
	public classifier: Classifier;

	private middlewares: Array<BotMiddleware> = [];
	private docs = new Map<string, BotDocument>();

	private stores = new Map<string, JsonObject>();
	private convos = new Map<string, BotRoutine>();
	private convoLock = new AsyncLock();

	public minThreshold: number;
	public minDeviation: number;

	constructor(opts: BotOptions = {}) {
		this.classifier = new Classifier({ languages: opts.languages });
		this.entityManager = new EntityManager();
		this.minThreshold = opts.minThreshold ?? 0.75;
		this.minDeviation = opts.minDeviation ?? 0.05;
	}

	/**
	 * Bot supported languages.
	 */
	public get languages() {
		return this.classifier.languages;
	}

	/**
	 * Bot training status.
	 */
	public get isTrained() {
		return this.classifier.isTrained;
	}

	/**
	 * Adds a new NER entity.
	 * @param entity - Entity to add.
	 */
	public addEntity(entity: Entity) {
		this.entityManager.addEntity(entity);
	}

	/**
	 * Adds a new NLU document.
	 * @param doc - Document to add.
	 */
	public addDocument(doc: BotDocument) {
		this.classifier.addDocument(doc);
		this.docs.set(doc.intent, doc);
	}

	/**
	 * Adds new bot middlware.
	 * @param middleware - Middleware to run after the classification.
	 */
	public addMiddleware(middleware: BotMiddleware) {
		this.middlewares.push(middleware);
	}

	/**
	 * Trains bot classifier.
	 * Calling this method may take some time.
	 */
	public train() {
		this.classifier.train();
	}

	/**
	 * Reads user store.
	 * @param id - User ID.
	 * @returns Store.
	 */
	public getStore(id: string) {
		return this.stores.get(id) ?? {};
	}

	/**
	 * Writes user store.
	 * @param id - User ID.
	 * @param store - Store to write.
	 */
	public setStore(id: string, store: JsonObject) {
		this.stores.set(id, store);
	}

	/**
	 * Performs a dry classifier run for a given request without giving an answer.
	 * @remarks This method does not trigger any handlers or middleware functions.
	 * @params req - Bot request.
	 * @returns Bot response.
	 */
	public async classify(req: BotRequest): Promise<BotResponse> {
		const { entities, template } = await this.entityManager.process(req.text);

		// Step 1: Run classifier both for template and original text.
		const [clsOriginal, clsTemplate] = await Promise.all([
			this.classifier.classifyText(req.text),
			this.classifier.classifyText(template),
		]);

		// Step 2: Determine primary classification list by the top score.
		const classifications =
			(clsOriginal[0]?.score ?? 0) >= (clsTemplate[0]?.score ?? 0)
				? clsOriginal
				: clsTemplate;

		// Step 3: Determine intent.
		const headScore = classifications[0]?.score ?? 0;
		const nextScore = classifications[1]?.score ?? 0;
		const deviation = headScore - nextScore;
		const intent =
			headScore >= this.minThreshold && deviation >= this.minDeviation
				? classifications[0]!.intent
				: null;

		// Step 4: Determine language.
		// prettier-ignore
		const language =
			classifications[0]?.language ||
			detect(req.text, { only: this.languages }) ||
			null;

		// Step 5 Return a basic response.
		return {
			language,
			intent,
			answer: null,
			classifications,
			entities,
		};
	}

	/**
	 * Processes given request and gives an appropriate answer.
	 * @param req - Bot request.
	 * @returns Bot response.
	 */
	public async process(req: BotRequest): Promise<BotResponse> {
		const lockId = req.user.id;
		return this.convoLock.acquire(lockId, async () => {
			const res = await this.classify(req);
			await this.processAnswer(req, res);
			await this.processMiddleware(req, res);
			return res;
		});
	}

	/**
	 * Runs middleware pipeline for given parameters.
	 * @param req - Request to process.
	 * @param res - Response to process.
	 */
	private async processMiddleware(req: BotRequest, res: BotResponse) {
		for (const middleware of this.middlewares) {
			let stop = false;
			await middleware.call(this, req, res, () => {
				stop = true;
			});
			if (stop) {
				break;
			}
		}
	}

	/**
	 * Classifies given request, processes it and returns bot response.
	 * @param req - Request to process.
	 * @returns Bot response.
	 */
	private async processAnswer(req: BotRequest, res: BotResponse) {
		const userId = req.user.id;

		// Step 1: Determine an active document and give a simple answer.
		const doc = res.intent ? this.docs.get(res.intent) : null;

		// Step 2A: Continue an active conversation.
		const convo = this.convos.get(userId);
		if (convo) {
			const convoResponse = await convo.process(req);
			if (convoResponse && !convo.isDone()) {
				Object.assign(res, convoResponse);
			} else {
				this.convos.delete(userId);
				this.processAnswer(req, res);
			}
		}

		// Step 2B: Give a simple answer.
		else if (doc && doc.answers) {
			res.answer = sample(doc.answers)!;
		}

		// Step 2C: Start a new conversation.
		else if (doc && doc.handler) {
			const store = this.stores.get(userId) ?? {};
			const convo: BotRoutine = new Routine((ctx) =>
				doc.handler!.call(this, {
					bot: this,
					req,
					store,
					classifications: res.classifications,
					entities: res.entities,
					classify: async (req) => this.classify(req),
					say: async (upd) => (await ctx.yield({ ...res, ...upd })) && undefined,
					ask: async (upd) => (await ctx.yield({ ...res, ...upd })), // prettier-ignore
				})
			);
			this.convos.set(userId, convo);
			this.stores.set(userId, store);
			this.processAnswer(req, res);
		}
	}
}
