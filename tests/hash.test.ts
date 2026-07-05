import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	hashValue,
	isEmptyValue,
	stableStringify,
	valuesEqual,
} from '../src/utils/hash';

describe('hash utils', () => {
	it('produces deterministic hashes', () => {
		assert.equal(hashValue('hello'), hashValue('hello'));
		assert.notEqual(hashValue('hello'), hashValue('world'));
	});

	it('is order-independent for objects', () => {
		assert.equal(
			stableStringify({ a: 1, b: 2 }),
			stableStringify({ b: 2, a: 1 }),
		);
		assert.equal(valuesEqual({ a: 1, b: 2 }, { b: 2, a: 1 }), true);
	});

	it('compares arrays', () => {
		assert.equal(valuesEqual([1, 2], [1, 2]), true);
		assert.equal(valuesEqual([1, 2], [2, 1]), false);
	});

	it('detects empty values', () => {
		assert.equal(isEmptyValue(undefined), true);
		assert.equal(isEmptyValue(null), true);
		assert.equal(isEmptyValue(''), true);
		assert.equal(isEmptyValue([]), true);
		assert.equal(isEmptyValue(0), false);
		assert.equal(isEmptyValue('a'), false);
		assert.equal(isEmptyValue(false), false);
	});

	it('hashes different types distinctly', () => {
		assert.notEqual(hashValue(1), hashValue('1'));
		assert.notEqual(hashValue(true), hashValue('true'));
	});
});
