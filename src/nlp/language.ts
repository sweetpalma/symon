/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { detectAll } from 'tinyld/heavy';

/**
 * Language detector options.
 */
export interface LanguageOptions {
	languages?: Array<string>;
}

/**
 * Language detector.
 */
export class Language {
	private languages: Array<string>;

	constructor(opts: LanguageOptions = {}) {
		this.languages = opts.languages ?? ['en', 'ru', 'uk'];
	}

	/**
	 * Detects language of a given `input`.
	 * @param input - Input to classify.
	 * @returns Detected languages.
	 */
	public process(input: string) {
		const only = this.languages;
		const classifications = detectAll(input, { only });
		const language = classifications[0]?.lang ?? 'un';
		return { language, classifications };
	}
}
