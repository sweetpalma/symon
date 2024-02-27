/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { Entity, EntityOptions, EntityMatch, EntityError } from './entity';

/**
 * Regular Expression Entity Options.
 */
export interface RegexpEntityOptions extends EntityOptions {
	match: RegExp;
}

/**
 * Regular Expression Entity Extractor.
 * Uses given regular expression to extract named entities.
 */
export class RegexpEntity extends Entity {
	private pattern: RegExp;

	constructor({ label, match }: RegexpEntityOptions) {
		super({ label });
		this.pattern = match;
		if (!this.pattern.global) {
			throw new EntityError(`RegexpEntity pattern must have a global flag.`);
		}
	}

	public async search(input: string) {
		const matches = [...input.matchAll(this.pattern)];
		return matches.map<EntityMatch>((match) => ({
			label: this.label,
			source: match[0],
			option: match[1] ?? match[0],
			score: 1,
			index: match.index!,
		}));
	}
}
