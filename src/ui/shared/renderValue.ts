export function renderValue(value: unknown): string {
	if (value === undefined) return '—';
	if (value === null) return 'null';
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	if (Array.isArray(value)) return `[${value.map(renderValue).join(', ')}]`;
	try {
		return JSON.stringify(value);
	} catch {
		return '[unserializable]';
	}
}
