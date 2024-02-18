/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { round, orderBy } from 'lodash';
import { LevenshteinDistance, Stemmer, PorterStemmer, RegexpTokenizer } from 'natural';
import { WordTokenizer } from './tokenizer';

/**
 * Entity definition.
 */
export interface Entity {
	label: string;
	options: Array<string> | Record<string, Array<string>>;
}

/**
 * Entity match.
 */
export interface EntityMatch {
	label: string;
	option: string;
	source: string;
	score: number;
	index: number;
}

/**
 * Entity manager options.
 */
export interface EntityManagerOptions {
	minThreshold?: number;
	tokenizer?: RegexpTokenizer;
	stemmer?: Stemmer;
}

/**
 * Entity manager error.
 */
export class EntityError extends Error {
	constructor(message: string) {
		super(message);
	}
}

/**
 * Named Entity Recognition (NER).
 */
export class EntityManager {
	private entities = new Map<string, Entity>();
	private minThreshold: number;
	private tokenizer: RegexpTokenizer;
	private stemmer: Stemmer;

	constructor(opts: EntityManagerOptions = {}) {
		this.minThreshold = opts.minThreshold ?? 0.75;
		this.tokenizer = opts.tokenizer ?? new WordTokenizer();
		this.stemmer = opts.stemmer ?? PorterStemmer;
	}

	/**
	 * Adds a new named entity.
	 * Throws an {@link EntityError} if such entity already exists.
	 * @param entity - Entity to classify.
	 */
	public addEntity(entity: Entity) {
		if (this.entities.get(entity.label)) {
			throw new EntityError(`Entity with label "${entity.label}" already exists.`);
		} else {
			this.entities.set(entity.label, entity);
		}
	}

	/**
	 * Returns entity by its label.
	 * @param label - Entity label.
	 * @returns Entity.
	 */
	public getEntity(label: string) {
		return this.entities.get(label);
	}

	/**
	 * Removes entity by its label.
	 * Does nothing if this entity does not exist.
	 * @param label - Entity label.
	 */
	public removeEntity(label: string) {
		this.entities.delete(label);
	}

	/**
	 * Returns Levenshtein distance between two strings.
	 * @remarks Both strings are stemmed beforehand.
	 * @param major - String A.
	 * @param minor - String B.
	 * @returns Levenshtein distance.
	 */
	public distance(major: string, minor: string) {
		const stemMajor = this.stemmer.stem(major);
		const stemMinor = this.stemmer.stem(minor);
		return LevenshteinDistance(stemMajor, stemMinor);
	}

	/**
	 * Returns similarity between two strings.
	 * Calculated by comparing Levenshtein distance and length of the `major` string.
	 * @param major - String A (primary, to compare against).
	 * @param minor - String B (secondary).
	 * @returns String similarity.
	 */
	public similarity(major: string, minor: string) {
		const leven = this.distance(major, minor);
		const score = round((major.length - leven) / major.length, 2);
		return Math.max(0, score);
	}

	/**
	 * Matches given token against known entities and returns the best match.
	 * @param input - String to match.
	 * @returns Matching entity or undefined.
	 */
	public match(input: string): EntityMatch | void {
		const entities = Array.from(this.entities.values());
		const evaluate = (label: string, option: string, example: string = option) => {
			const score = this.similarity(input, example);
			return { label, option, score };
		};

		// prettier-ignore
		const scores = entities.flatMap(({ label, options }) => {
			if (Array.isArray(options)) {
				return options.map((option) => {
					return evaluate(label, option);
				});
			} else {
				const pairs = Object.entries(options);
				return pairs.flatMap(([option, examples]) => examples.map((example) => {
					return evaluate(label, option, example);
				}));
			}
		});

		const [topResult] = orderBy(scores, 'score', 'desc');
		if (topResult && topResult.score >= this.minThreshold) {
			return {
				...topResult,
				source: input,
				index: 0,
			};
		}
	}

	/**
	 * Processes text and returns an array of detected entities.
	 * @param input - String to process.
	 * @returns Array of detected entities.
	 */
	public process(input: string) {
		const entities: Array<EntityMatch> = [];
		for (const token of this.tokenizer.tokenize(input) ?? []) {
			const match = this.match(token);
			if (match) entities.push(match);
		}

		// prettier-ignore
		let template = input;
		for (const match of entities) {
			match.index = template.indexOf(match.source);
			template = template.replace(match.source, `%${match.label}%`);
		}

		return {
			entities,
			template,
		};
	}
}
