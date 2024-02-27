/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { round, keyBy, mapValues, isArray } from 'lodash';
import { LevenshteinDistance, Stemmer, PorterStemmer, RegexpTokenizer } from 'natural';
import { Entity, EntityOptions, EntityMatch } from './entity';
import { WordTokenizer } from '../nlp';

/**
 * Enumerated Entity Options.
 */
export interface EnumEntityOptions extends EntityOptions {
	options: Array<string> | Record<string, Array<string>>;
	minThreshold?: number;
	tokenizer?: RegexpTokenizer;
	stemmer?: Stemmer;
}

/**
 * Enumerated Entity Extractor.
 */
export class EnumEntity extends Entity {
	private options: Record<string, Array<string>>;
	private minThreshold: number;
	private tokenizer: RegexpTokenizer;
	private stemmer: Stemmer;

	constructor({ label, options, minThreshold, tokenizer, stemmer }: EnumEntityOptions) {
		super({ label });
		this.options = isArray(options) ? mapValues(keyBy(options), (opt) => [opt]) : options;
		this.minThreshold = minThreshold ?? 0.75;
		this.tokenizer = tokenizer ?? new WordTokenizer();
		this.stemmer = stemmer ?? PorterStemmer;
	}

	public async search(input: string) {
		const tokens = this.tokenizer.tokenize(input)!;
		return tokens
			.flatMap((token) => {
				return this.match(token).slice(0, 1);
			})
			.filter((entity) => {
				return entity.score >= this.minThreshold;
			})
			.map<EntityMatch>((entity) => {
				const index = input.indexOf(entity.source);
				input = input.replace(entity.source, ' '.repeat(entity.source.length));
				return { ...entity, index };
			});
	}

	/**
	 * Returns Levenshtein distance between two strings.
	 * @remarks Both strings are stemmed beforehand.
	 * @param major - String A.
	 * @param minor - String B.
	 * @returns Levenshtein distance.
	 */
	private distance(major: string, minor: string) {
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
	private similarity(major: string, minor: string) {
		const leven = this.distance(major, minor);
		const score = round((major.length - leven) / major.length, 2);
		return Math.max(0, score);
	}

	/**
	 * Matches `token` against all known options and returns their scores.
	 * @param token - Token to match.
	 * @returns Matching entities.
	 */
	private match(token: string) {
		return Object.entries(this.options)
			.flatMap<EntityMatch>(([option, examples]) =>
				examples.map((example) => ({
					label: this.label,
					option,
					source: token,
					score: this.similarity(token, example),
					index: 0,
				}))
			)
			.sort((a, b) => {
				return b.score - a.score;
			});
	}
}
