/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */

/**
 * Routine internal context.
 */
export interface RoutineContext<Input, Output> {
	yield(output: Output): Promise<Input>;
}

/**
 * Routine constructor script.
 */
export interface RoutineScript<Input, Output> {
	(ctx: RoutineContext<Input, Output>): Promise<void>;
}

/**
 * Generic Generator-like Routine.
 */
export class Routine<Input, Output> implements AsyncIterator<Output, void, Input> {
	private script: () => Promise<void>;
	private scriptPromise?: Promise<void>;
	private scriptResolved = false;

	private throwToGlobal = (_: unknown) => {};
	private yieldToGlobal = (_: Output | undefined) => {};
	private yieldToScript = (_: Input) => {};

	// prettier-ignore
	constructor(script: RoutineScript<Input, Output>) {
		const ctx = { yield: this.yield.bind(this) };
		this.script = () => script(ctx)
			.catch((error) => {
				this.throwToGlobal(error);
			})
			.finally(() => {
				this.scriptResolved = true;
				this.yieldToGlobal(undefined);
			});
	}

	/**
	 * Returns routine execution status.
	 * @returns Boolean indicating routine status.
	 */
	public isDone() {
		return this.scriptResolved;
	}

	/**
	 * Returns routine iterator.
	 * @returns Routine asynchronous iterator.
	 */
	[Symbol.asyncIterator]() {
		return this;
	}

	/**
	 * Yields `data` to the routine script.
	 * @param data - Data to yield inside the routine.
	 * @returns Result as an `IteratorResult`.
	 */
	public async next(data: Input): Promise<IteratorResult<Output>> {
		const value = await this.process(data);
		if (!value) {
			return { done: true, value: undefined };
		} else {
			return { done: false, value };
		}
	}

	/**
	 * Yields `data` to the routine script.
	 * @param data - Data to yield inside the routine.
	 * @returns Result as a raw data.
	 */
	public async process(data: Input) {
		return new Promise<Output | void>((resolve, reject) => {
			if (this.scriptResolved) {
				resolve(undefined);
				return;
			}
			if (!this.scriptPromise) {
				this.yieldToGlobal = resolve;
				this.throwToGlobal = reject;
				this.scriptPromise = this.script();
			} else {
				this.yieldToGlobal = resolve;
				this.throwToGlobal = reject;
				this.yieldToScript(data);
			}
		});
	}

	/**
	 * Yields `data` from the routine script.
	 * @param data - Data to yield outside.
	 * @returns Routine callback promise.
	 */
	private yield(data: Output) {
		return new Promise<Input>((resolve) => {
			this.yieldToScript = resolve;
			this.yieldToGlobal(data);
		});
	}
}
