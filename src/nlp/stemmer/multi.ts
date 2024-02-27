/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { pickBy } from 'lodash';
import { detect } from 'tinyld';
import {
	Stemmer,
	PorterStemmer,
	PorterStemmerEs,
	PorterStemmerFa,
	PorterStemmerFr,
	PorterStemmerIt,
	PorterStemmerNl,
	PorterStemmerNo,
	PorterStemmerPt,
	PorterStemmerSv,
	PorterStemmerDe,
	PorterStemmerRu,
	StemmerJa,
	StemmerId,
} from 'natural';
import { PorterStemmerUk } from './uk';

// TODO: Better language fallback approach

/**
 * Multi-language stemmer default stemmers.
 * @internal
 */
const MULTI_STEMMER_DEFAULTS = {
	uk: new PorterStemmerUk(),
	en: PorterStemmer,
	es: PorterStemmerEs,
	fa: PorterStemmerFa,
	fr: PorterStemmerFr,
	it: PorterStemmerIt,
	nl: PorterStemmerNl,
	no: PorterStemmerNo,
	pt: PorterStemmerPt,
	sv: PorterStemmerSv,
	de: PorterStemmerDe,
	ru: PorterStemmerRu,
	ja: StemmerJa,
	id: StemmerId,
};

/**
 * Multi-language stemmer options.
 */
export interface MultiStemmerOptions {
	languages?: Array<string>;
}

/**
 * Multi-language stemmer.
 */
export class MultiStemmer implements Stemmer {
	private stemmers: Record<string, Stemmer>;

	constructor(opts: MultiStemmerOptions = {}) {
		const languages = opts.languages ?? Object.keys(MULTI_STEMMER_DEFAULTS);
		this.stemmers = pickBy(MULTI_STEMMER_DEFAULTS, (_, x) => languages.includes(x));
	}

	public get languages() {
		const languages = Object.keys(this.stemmers);
		return languages;
	}

	public getStemmer(language: string) {
		const stemmer = this.stemmers[language] ?? null;
		return stemmer;
	}

	public setStemmer(language: string, stemmer: Stemmer) {
		this.stemmers[language] = stemmer;
	}

	public detectLanguage(text: string) {
		const fallback = this.languages[0]!;
		const language = detect(text, { only: this.languages }) || fallback;
		return language;
	}

	public detectStemmer(text: string) {
		const language = this.detectLanguage(text);
		const stemmer = this.getStemmer(language) ?? PorterStemmer;
		return stemmer;
	}

	public removeStopWords(word: Array<string>) {
		throw new ReferenceError('MultiStemmer does not support direct stopword editing.');
	}

	public addStopWords(word: Array<string>) {
		throw new ReferenceError('MultiStemmer does not support direct stopword editing.');
	}

	public addStopWord(word: string) {
		throw new ReferenceError('MultiStemmer does not support direct stopword editing.');
	}

	public removeStopWord(word: string) {
		throw new ReferenceError('MultiStemmer does not support direct stopword editing.');
	}

	public tokenizeAndStem(text: string, keepStops: boolean = false) {
		const stemmer = this.detectStemmer(text);
		return stemmer.tokenizeAndStem(text, keepStops);
	}

	public stem(token: string) {
		const stemmer = this.detectStemmer(token);
		return stemmer.stem(token);
	}
}
