/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import {
	ClassifierBase,
	ApparatusClassification,
	LogisticRegressionClassifier,
	Stemmer,
	PorterStemmer,
} from 'natural';
import { round, groupBy, meanBy, sumBy } from 'lodash';
import { queueAsPromised as Queue, promise as createQueue } from 'fastq';
import { Language } from './language';

/**
 * Classification.
 */
export interface ClassifierMatch {
	intent: string;
	language: string;
	score: number;
}

/**
 * Classifier learning sample.
 */
export interface ClassifierDocument {
	intent: string;
	language?: string;
	examples: Array<string>;
}

/**
 * Classifier options.
 */
export interface ClassifierOptions {
	stemmer?: Stemmer;
	classifier?: ClassifierBase;
	keepStops?: boolean;
}

/**
 * Classifier error.
 */
export class ClassifierError extends Error {
	constructor(message: string) {
		super(message);
	}
}

/**
 * Natural Language Understanding (NLU).
 */
export class Classifier {
	private language = new Language();
	private classifier: ClassifierBase;
	private classifierQueue: Queue<string, Array<ApparatusClassification>>;
	private classifierReady = false;

	// prettier-ignore
	constructor(opts: ClassifierOptions = {}) {
		const stemmer = opts.stemmer ?? PorterStemmer;
		this.classifier = opts.classifier ?? new LogisticRegressionClassifier(stemmer);
		this.classifier.setOptions({ keepStops: opts.keepStops ?? true });
		this.classifierQueue = createQueue((input) => Promise.resolve().then(() => {
			return this.classifier.getClassifications(input);
		}), 1);
	}

	/**
	 * Classifier stemmer.
	 */
	public get stemmer() {
		return this.classifier.stemmer;
	}

	/**
	 * Classifier document count check.
	 */
	public get isEmpty() {
		return this.classifier.docs.length < 1;
	}

	/**
	 * Classifier training status.
	 */
	public get isTrained() {
		return this.classifierReady;
	}

	/**
	 * Adds a new document sample.
	 * @param doc - Document to sample.
	 */
	public addDocument(doc: ClassifierDocument) {
		const originalCount = this.classifier.docs.length;
		for (const example of doc.examples) {
			const language = doc.language ?? this.language.process(example).language;
			const label = this.buildLabel(doc.intent, language);
			this.classifier.addDocument(example, label);
		}
		if (originalCount === this.classifier.docs.length) {
			throw new ClassifierError('No new documents were added. Bad tokenizer?');
		}
	}

	/**
	 * Trains the classifier.
	 * @remarks Running this method may take some time.
	 */
	public train() {
		if (this.isEmpty) {
			throw new ClassifierError('Empty classifier could not be trained.');
		}
		this.classifier.train();
		this.classifierReady = true;
	}

	/**
	 * Classifies given `input` as a single sentence.
	 * @remarks May be slow and inaccurate for long texts, use {@link classifyText} instead.
	 * @param input - Sample to classify.
	 * @returns List of matching classifications.
	 */
	public async classify(input: string) {
		if (!this.isTrained) {
			throw new ClassifierError('Classifier is not trained.');
		}

		// Step 1: Perform basic classification.
		const classifications = (await this.classifierQueue.push(input))
			.map<ClassifierMatch>((cls) => {
				const score = round(cls.value, 2);
				return { ...this.parseLabel(cls.label), score };
			})
			.filter((cls) => {
				return cls.score > 0;
			});

		// Step 2A: Return single classification.
		if (classifications.length <= 1) {
			return classifications;
		}

		// Step 2B: Remove mean classifications and return.
		const mean = meanBy(classifications, 'score');
		return classifications.filter((cls) => {
			return cls.score > mean;
		});
	}

	/**
	 * Classifies given `input` as a collection of sentences.
	 * @param input - Sample to classify.
	 * @returns List of matching classifications.
	 */
	public async classifyText(input: string) {
		const sentences = input.split(/[!?.]/).filter((str) => str.trim().length > 0);
		if (sentences.length <= 1) {
			return this.classify(input);
		}

		// Step 1: Classify each sentence separately.
		const classify = this.classify.bind(this);

		// Step 2: Remove empty classifications and merge the rest together.
		const classifications = (await Promise.all(sentences.map(classify)))
			.filter((sentenceClassifications) => {
				return sentenceClassifications.length > 0;
			})
			.reduce((acc, curr) => {
				const grouped = groupBy([...acc, ...curr], (cls) => {
					return this.buildLabel(cls.intent, cls.language);
				});
				return Object.entries(grouped).map(([label, sentenceClassifications]) => {
					const score = sumBy(sentenceClassifications, 'score');
					return { ...this.parseLabel(label), score };
				});
			}, []);

		// Step 3: Normalize classification scores, sort and return.
		const ratio = 1 / sumBy(classifications, 'score');
		return classifications
			.map((cls) => {
				const score = round(cls.score * ratio, 2);
				return { ...cls, score };
			})
			.sort((a, b) => {
				return b.score - a.score;
			});
	}

	/**
	 * Builds an internal classifier label.
	 * @param intent - Document intent.
	 * @param language - Document language.
	 * @returns Document label.
	 */
	private buildLabel(intent: string, language: string) {
		return `${language}/${intent}`;
	}

	/**
	 * Parses an internal classifier label.
	 * @param label - Document label.
	 * @returns Document intent and language.
	 */
	private parseLabel(label: string) {
		const match = label.match(/(.+?)\/(.+)/iu);
		const [language, intent] = match!.slice(1) as [string, string];
		return { intent, language };
	}
}
