/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { Stemmer as NaturalStemmer } from 'natural';
import { WordTokenizer as Tokenizer } from '../tokenizer';
import defaultStopwords from '../data/uk-stopwords.json';

// prettier-ignore
export const STEMMER_RVRE = (
	/^(.*?[аеиоуюяіїє])(.*)$/iu
);

// prettier-ignore
const STEMMER_ADJECTIVE = (
	/(у|а|е|і|ій|ім|ий|им|их|ою|ої|ому|ого|ими)$/iu
);

// prettier-ignore
const STEMMER_VERB_GENERAL = (
	/(у|ю|е|є|ує|сь|ся|ив|ать|ять|ав|али|учи|ячи|вши|ши|ме|яти)$/iu
);

// prettier-ignore
const STEMMER_VERB_SPECIAL = (
	/(овувала|овував|увала|ував|увати)$/iu
);

// prettier-ignore
const STEMMER_NOUN_GENERAL = (
	/(я|у|а|е|і|и|о|ою|ам|ах|ів|ов|ом|им|ами|ові)$/iu
);

// prettier-ignore
const STEMMER_NOUN_SPECIAL = (
	/(очки|очка|очку|очок|очком|очків|очках|очкам|очками|очкові|ість|істю|осте|ості)$/iu
);

/**
 * Stemmer for Ukrainian language.
 *
 * This implementation incorporates ideas from two other stemmers.
 * It is my duty to mention them here:
 *
 * - https://github.com/vgrichina/ukrainian-stemmer
 * - https://github.com/tochytskyi/ukrstemmer
 */
export class PorterStemmerUk implements NaturalStemmer {
	private stopwords = defaultStopwords;
	private tokenizer = new Tokenizer();

	/**
	 * Adds multiple words to the ignore list.
	 * @param words - Array of stopwords to add.
	 */
	public addStopWords(words: Array<string>) {
		this.stopwords.push(...words);
	}

	/**
	 * Removes multiple words from the ignore list.
	 * @param words - Array of stopwords to remove.
	 */
	public removeStopWords(words: Array<string>) {
		this.stopwords = this.stopwords.filter((x) => words.includes(x));
	}

	/**
	 * Adds a new stop word to the ignore list.
	 * @param word - Stopword to add.
	 */
	public addStopWord(word: string) {
		this.addStopWords([word]);
	}

	/**
	 * Removes a stop word from the ignore list.
	 * @param word - Stopword to remove.
	 */
	public removeStopWord(word: string) {
		this.removeStopWords([word]);
	}

	/**
	 * Splits `input` string into an array of tokens and stems them.
	 * @param text - Input to stem and tokenize.
	 * @param keepStops - Flat to either keep or remove stopwords.
	 * @returns Array of stemmed tokens.
	 */
	public tokenizeAndStem(text: string, keepStops: boolean = false) {
		let tokens = this.tokenizer.tokenize(text);
		if (!keepStops) tokens = tokens.filter((x) => !this.stopwords.includes(x));
		return tokens.map((x) => this.stem(x));
	}

	/**
	 * Stems given `token`, returning its lexical "root".
	 * @param token - Input to stem.
	 * @returns Stemmed token.
	 */
	public stem(token: string) {
		let normalizedToken = token.trim().toLowerCase();
		let [_, head, tail] = normalizedToken.match(STEMMER_RVRE) ?? [];
		if (!head || !tail) {
			return normalizedToken;
		}

		// Step 1A: Check special longer forms first...
		if (tail.match(STEMMER_VERB_SPECIAL)) {
			tail = tail.replace(STEMMER_VERB_SPECIAL, '');
		} else if (tail.match(STEMMER_NOUN_SPECIAL)) {
			tail = tail.replace(STEMMER_NOUN_SPECIAL, '');
		}

		// Step 1B: ...or try to remove shorter variants instead.
		else if (tail.match(STEMMER_ADJECTIVE)) {
			tail = tail.replace(STEMMER_ADJECTIVE, '');
		} else if (tail.match(STEMMER_VERB_GENERAL)) {
			tail = tail.replace(STEMMER_VERB_GENERAL, '');
		} else if (tail.match(STEMMER_NOUN_GENERAL)) {
			tail = tail.replace(STEMMER_NOUN_GENERAL, '');
		}

		// Step 2: Perform alternation stemming.
		tail = tail.replace(/ядер$/, 'ядр');
		tail = tail.replace(/ач$/, 'ак');
		tail = tail.replace(/іч$/, 'ік');
		tail = tail.replace(/че$/, 'ік');

		// Step 3: Remove soft signs, apostrophes and repetition.
		tail = tail.replace(/ь$/, '').replace(/нн$/, '');
		return head + tail;
	}
}
