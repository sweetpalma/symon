/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { WordTokenizer as Tokenizer } from 'natural';

// prettier-ignore
const TOKENIZER_NON_WORD_CHARACTER = (
	/[^'\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}\p{Join_Control}]+/iu
);

/**
 * Improved Word Tokenizer.
 */
export class WordTokenizer extends Tokenizer {
	private withoutEmpty(tokens: Array<string>) {
		return tokens.filter((token) => token.trim().length > 0);
	}

	/**
	 * Splits `input` string into an array of tokens.
	 * @param input - String to tokenize.
	 * @returns Array of tokens.
	 */
	public override tokenize(input: string) {
		const tokens = this.trim(input.split(TOKENIZER_NON_WORD_CHARACTER));
		return this.withoutEmpty(tokens);
	}
}
