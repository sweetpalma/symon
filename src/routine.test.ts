/**
 * Part of a Symon SDK, all rights reserved.
 * This code is licensed under MIT LICENSE, check LICENSE file for details.
 */
import { describe, it, expect } from 'vitest';
import LeakDetector from 'jest-leak-detector'; // seems to work just fine with Vitest
import { Routine } from './routine';

describe('Routine', () => {
	it('yields data outside', async () => {
		const routine = new Routine<void, string>(async (ctx) => {
			await ctx.yield('Hello');
			await ctx.yield('World');
		});
		expect(await routine.process()).toEqual('Hello');
		expect(await routine.process()).toEqual('World');
		expect(await routine.process()).toBeUndefined();
	});

	it('yields data inside', async () => {
		const routine = new Routine<string, string>(async (ctx) => {
			const name = await ctx.yield('What is your name?');
			await ctx.yield(`Your name is ${name}`);
		});
		expect(await routine.process('Hello')).toEqual('What is your name?');
		expect(await routine.process('Symon')).toEqual('Your name is Symon');
		expect(await routine.process('Right')).toBeUndefined();
	});

	it('yields data in a loop', async () => {
		const answers: Array<string> = [];
		const routine = new Routine<void, string>(async (ctx) => {
			await ctx.yield('Hello');
			await ctx.yield('World');
		});
		for await (const response of routine) {
			answers.push(response);
		}
		expect(answers).toEqual(['Hello', 'World']);
	});

	it('yields early termination', async () => {
		const convo = new Routine<void, string>(async (ctx) => {
			await ctx.yield('Hello');
			return;
			await ctx.yield('World');
		});
		expect(await convo.process()).toEqual('Hello');
		expect(await convo.process()).toBeUndefined();
	});

	it('yields error', async () => {
		const convo = new Routine<void, void>(async () => {
			throw new Error('Test');
		});
		await expect(() => convo.next()).rejects.toThrowError('Test');
	});

	it('accepts empty script', async () => {
		const convo = new Routine<void, void>(async () => {
			return;
		});
		expect(await convo.process()).toBeUndefined();
		expect(await convo.process()).toBeUndefined();
	});

	it('causes no memory leak after completion', async () => {
		let convo: Routine<void, string> | void = new Routine(async (ctx) => {
			await ctx.yield('Hello');
			await ctx.yield('World');
		});
		const leakDetector = new LeakDetector(convo);
		expect(await leakDetector.isLeaking()).toBe(true);
		expect(await convo.process()).toEqual('Hello');
		expect(await convo.process()).toEqual('World');
		expect(await convo.process()).toBeUndefined();
		convo = undefined; // remove reference
		expect(await leakDetector.isLeaking()).toBe(false);
	});

	it('causes no memory leak when abandoned', async () => {
		let convo: Routine<void, string> | void = new Routine(async (ctx) => {
			await ctx.yield('Hello');
			await ctx.yield('World');
		});
		const leakDetector = new LeakDetector(convo);
		expect(await leakDetector.isLeaking()).toBe(true);
		expect(await convo.process()).toEqual('Hello');
		convo = undefined; // remove reference
		expect(await leakDetector.isLeaking()).toBe(false);
	});
});
