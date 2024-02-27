/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */

/**
 * Entity Match.
 */
export interface EntityMatch {
	label: string;
	option: string;
	source: string;
	score: number;
	index: number;
}

/**
 * Generic Entity Options.
 * @internal
 */
export interface EntityOptions {
	label: string;
}

/**
 * Generic Entity Error.
 */
export class EntityError extends Error {
	constructor(message: string) {
		super(message);
	}
}

/**
 * Generic Entity Extractor.
 * This abstract class is meant to be extended to match various NER strategies.
 * @internal
 */
export abstract class Entity {
	public readonly label: string;
	public constructor({ label }: EntityOptions) {
		this.label = label;
	}

	/**
	 * Converts `input` into a template by replacing matching entities with their labels.
	 * @param input - String to process.
	 * @param entities - List of entities.
	 * @returns Template string.
	 */
	public static template(input: string, entities: Array<EntityMatch>) {
		return entities.reduce((acc, { label, index, source }) => {
			const pos = index - (input.length - acc.length);
			return acc.substring(0, pos) + `%${label}%` + acc.substring(pos + source.length);
		}, input);
	}

	/**
	 * Processes `input` and returns an array of matching entities.
	 * @param input - String to process.
	 * @returns Matching entities.
	 */
	public abstract search(input: string): Promise<Array<EntityMatch>>;

	/**
	 * Processes `input` and returns a template string and an array of matching entities.
	 * @param input - String to process.
	 * @returns Template and matching entities.
	 */
	public async process(input: string) {
		const entities = await this.search(input);
		const template = Entity.template(input, entities);
		return { template, entities };
	}
}

/**
 * Entity Manager.
 * Stores and processes multiple entities at once.
 */
export class EntityManager {
	private extractors = new Map<string, Entity>();

	/**
	 * Adds a new entity extractor.
	 * Throws an {@link EntityError} if entity with such label is already added.
	 * @param extractor - Entity extractor.
	 */
	public addEntity(extractor: Entity) {
		if (this.extractors.get(extractor.label)) {
			throw new EntityError(`Entity with label "${extractor.label}" already exists.`);
		} else {
			this.extractors.set(extractor.label, extractor);
		}
	}

	/**
	 * Returns entity extractor by its label.
	 * @param label - Entity label.
	 * @returns Entity extractor.
	 */
	public getEntity(label: string) {
		return this.extractors.get(label);
	}

	/**
	 * Removes entity extractor by its label.
	 * Does nothing if this extractor does not exist.
	 * @param label - Entity label.
	 */
	public removeEntity(label: string) {
		this.extractors.delete(label);
	}

	/**
	 * Processes `input` and returns an array of matching entities.
	 * @param input - String to process.
	 * @returns Matching entities.
	 */
	public async search(input: string) {
		const extractors = [...this.extractors.values()];

		// Step 1: Run entity search, then flatten results and sort them by position.
		const entities = (await Promise.all(extractors.map((e) => e.search(input))))
			.flat()
			.sort((a, b) => {
				return a.index - b.index;
			});

		// Step 2: Filter overlapping indexes and return.
		let lastEnding = 0;
		return entities.filter((entity) => {
			if (entity.index < lastEnding) {
				return false;
			} else {
				lastEnding = entity.index + entity.source.length;
				return true;
			}
		});
	}

	/**
	 * Processes `input` and returns a template string and an array of matching entities.
	 * @param input - String to process.
	 * @returns Template and matching entities.
	 */
	public async process(input: string) {
		const entities = await this.search(input);
		const template = Entity.template(input, entities);
		return { template, entities };
	}
}
