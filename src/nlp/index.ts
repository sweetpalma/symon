/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */

// Export NaturalNode tokenizers and stemmers first.
export * from 'natural/lib/natural/tokenizers';
export * from 'natural/lib/natural/stemmers';

// Export multi-language stemmer and classifier.
export * from './stemmer/multi';
export * from './classifier';

// Export improved tokenizer.
export { WordTokenizer } from './tokenizer';

// Export improved stemmer for Ukrainian language.
// Exporting instance instead of class is done to conform with Natural export format.
import { PorterStemmerUk } from './stemmer';
const stemmerInstance = new PorterStemmerUk();
export { stemmerInstance as PorterStemmerUk };
