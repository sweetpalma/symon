/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { round, groupBy, meanBy, sumBy } from 'lodash';
import { ApparatusClassification, LogisticRegressionClassifier } from 'natural';
import { queueAsPromised as Queue, promise as createQueue } from 'fastq';
import { MultiStemmer } from './stemmer';

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
	languages?: Array<string>;
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
 * Multi-language Classifier.
 */
export class Classifier {
	private stemmer: MultiStemmer;
	private classifier: LogisticRegressionClassifier;
	private classifierQueue: Queue<string, Array<ApparatusClassification>>;
	private classifierReady: boolean = false;

	// prettier-ignore
	constructor(opts: ClassifierOptions = {}) {
		this.stemmer = new MultiStemmer({ languages: opts.languages });
		this.classifier = new LogisticRegressionClassifier(this.stemmer);
		this.classifier.setOptions({ keepStops: opts.keepStops ?? true });
		this.classifierQueue = createQueue((input) => Promise.resolve().then(() => {
			return this.classifier.getClassifications(input);
		}), 1);
	}

	/**
	 * Supported languages.
	 */
	public get languages() {
		return this.stemmer.languages;
	}

	/**
	 * Emptiness status.
	 * @remarks Empty classifier could not be trained.
	 */
	public get isEmpty() {
		return this.classifier.docs.length < 1;
	}

	/**
	 * Training status.
	 * @remarks Untrained classifier can't be used.
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
		if (doc.examples.length === 0) {
			throw new ClassifierError('No examples were provided.');
		}
		for (const example of doc.examples) {
			const language = this.stemmer.detectLanguage(example);
			const label = this.buildLabel(doc.intent, language);
			this.classifier.addDocument(example, label);
		}
		if (originalCount === this.classifier.docs.length) {
			throw new ClassifierError('No new documents were added. Invalid language?');
		}
	}

	/**
	 * Trains the classifier.
	 * @remarks Running this method is synchronous and may take some time.
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
	public async classify(text: string) {
		if (!this.isTrained) {
			throw new ClassifierError('Classifier is not trained.');
		}

		// Step 1: Classify, then filter out meaningless classifications.
		const classifications = (await this.classifierQueue.push(text))
			.map<ClassifierMatch>((cls) => {
				const score = round(cls.value, 2);
				return { ...this.parseLabel(cls.label), score };
			})
			.filter((cls) => {
				return cls.score >= 0.5;
			});

		// Step 3A: Return single classification.
		if (classifications.length <= 1) {
			return classifications;
		}

		// Step 3B: Remove mean classifications and return.
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
	public async classifyText(text: string) {
		const sentences = text.split(/[!?.]/).filter((str) => str.trim().length > 0);
		if (sentences.length <= 1) {
			return this.classify(text);
		}

		// Step 1: Classify each sentence separately.
		const classify = this.classify.bind(this);

		// Step 2: Remove empty classifications and merge the rest together.
		const classifications = (await Promise.all(sentences.map(classify)))
			.filter((sentenceClassifications) => {
				return sentenceClassifications.length > 0;
			})
			.reduce((acc, curr) => {
				const groupedByLabel = groupBy([...acc, ...curr], (cls) => {
					return this.buildLabel(cls.intent, cls.language);
				});
				return Object.entries(groupedByLabel).map(([label, groupedClassifications]) => {
					const score = sumBy(groupedClassifications, 'score');
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
	 * @internal
	 * @param intent - Document intent.
	 * @param language - Document language.
	 * @returns Document label.
	 */
	private buildLabel(intent: string, language: string) {
		return `${language}/${intent}`;
	}

	/**
	 * Parses an internal classifier label.
	 * @internal
	 * @param label - Document label.
	 * @returns Document intent and language.
	 */
	private parseLabel(label: string) {
		const match = label.match(/(.+?)\/(.+)/iu);
		const [language, intent] = match!.slice(1) as [string, string];
		return { intent, language };
	}
}
