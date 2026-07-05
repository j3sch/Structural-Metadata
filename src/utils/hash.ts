/**
 * Stable value serialization and hashing for the managed-state machinery.
 *
 * The hash must be deterministic across runs and platforms, so values are
 * canonically serialized before hashing (sorted object keys, typed prefixes).
 */

/** Deterministic serialization of a JSON-compatible value. */
export function stableStringify(value: unknown): string {
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (typeof value === 'string') return 's:' + value;
	if (typeof value === 'number') return 'n:' + String(value);
	if (typeof value === 'boolean') return 'b:' + String(value);
	if (Array.isArray(value)) {
		return 'a:[' + value.map(stableStringify).join(',') + ']';
	}
	if (typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		const keys = Object.keys(obj).sort();
		return (
			'o:{' +
			keys.map((k) => stableStringify(k) + ':' + stableStringify(obj[k])).join(',') +
			'}'
		);
	}
	if (typeof value === 'bigint') return 'x:' + value.toString();
	if (typeof value === 'symbol') return 'x:' + value.toString();
	if (typeof value === 'function') return 'x:function';
	return 'x:unknown';
}

/** FNV-1a 32-bit hash of the stable serialization of `value`. */
export function hashValue(value: unknown): string {
	const str = stableStringify(value);
	let h = 0x811c9dc5;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return (h >>> 0).toString(16);
}

/** Deep equality based on canonical serialization. */
export function valuesEqual(a: unknown, b: unknown): boolean {
	return stableStringify(a) === stableStringify(b);
}

/** True for values considered "empty" (missing, null, empty string, empty array). */
export function isEmptyValue(value: unknown): boolean {
	if (value === undefined || value === null) return true;
	if (value === '') return true;
	if (Array.isArray(value) && value.length === 0) return true;
	return false;
}
