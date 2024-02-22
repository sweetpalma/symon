/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import AsyncLock from 'async-lock';
import { sample } from 'lodash';
import { JsonObject } from 'type-fest';
import { Routine } from './routine';
import {
	Entity,
	EntityMatch,
	EntityManager,
	EntityManagerOptions,
	Classifier,
	ClassifierDocument,
	ClassifierMatch,
	ClassifierOptions,
	Stemmer,
	PorterStemmer,
} from './nlp';

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
	stemmer?: Stemmer;
	entityManager?: EntityManagerOptions;
	classifier?: ClassifierOptions;
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
		const stemmer = opts.stemmer ?? PorterStemmer;
		this.entityManager = new EntityManager({ stemmer, ...opts.entityManager });
		this.classifier = new Classifier({ stemmer, ...opts.classifier });
		this.minThreshold = opts.minThreshold ?? 0.75;
		this.minDeviation = opts.minDeviation ?? 0.05;
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
		if (this.docs.has(doc.intent)) {
			throw new BotError(`Document with intent "${doc.intent}" already exists.`);
		}
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
	 * Handles given request and returns bot response.
	 * @param req - Request to process.
	 * @returns Bot response.
	 */
	public async process(req: BotRequest): Promise<BotResponse> {
		const lockId = req.user.id;
		return this.convoLock.acquire(lockId, async () => {
			const res = await this.runClassifier(req);
			await this.runMiddleware(req, res);
			return res;
		});
	}

	/**
	 * Runs middleware pipeline for given parameters.
	 * @param req - Request to process.
	 * @param res - Response to process.
	 */
	private async runMiddleware(req: BotRequest, res: BotResponse) {
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
	private async runClassifier(req: BotRequest): Promise<BotResponse> {
		const { entities, template } = this.entityManager.process(req.text);
		const classifications = await this.classifier.classifyText(template);
		const userId = req.user.id;

		// Step 1: Determine intent.
		const headScore = classifications[0]?.score ?? 0;
		const nextScore = classifications[1]?.score ?? 0;
		const deviation = headScore - nextScore;
		const intent =
			headScore >= this.minThreshold && deviation >= this.minDeviation
				? classifications[0]!.intent
				: null;

		// Step 2: Build a basic response.
		const doc = intent ? this.docs.get(intent) : undefined;
		const answer = sample(doc?.answers) ?? null;
		const res: BotResponse = {
			intent,
			answer,
			classifications,
			entities,
		};

		// Step 3: Determine current user store and active conversation.
		const convo = this.convos.get(userId);
		const store = this.stores.get(userId) ?? {};
		this.stores.set(userId, store);

		// Step 4A: Continue an existing conversation.
		if (convo) {
			const convoRes = await convo.process(req);
			if (convoRes && !convo.isDone()) {
				return convoRes;
			} else {
				this.convos.delete(userId);
				return this.runClassifier(req);
			}
		}

		// Step 4B: Start a new conversation.
		else if (doc?.handler) {
			// prettier-ignore
			const routine: BotRoutine = new Routine((ctx) =>
				doc.handler!.call(this, {
					bot: this,
					req,
					classifications,
					entities,
					store,
					say: async (upd) => await ctx.yield({ ...res, ...upd }) && undefined,
					ask: async (upd) => await ctx.yield({ ...res, ...upd }),
				})
			);
			this.convos.set(userId, routine);
			const handlerRes = await routine.process(req);
			return handlerRes || res;
		}

		// Step 4C: Return a basic response.
		else {
			return res;
		}
	}
}
