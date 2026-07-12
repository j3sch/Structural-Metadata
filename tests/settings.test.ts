import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defaultSettings, mergeSettings, validateDebounce, validateRule } from '../src/settings';
import type { StructuralRule } from '../src/domain/rules';

const validRule: StructuralRule = {
	id: 'rule-1',
	name: 'Project',
	enabled: true,
	priority: 100,
	property: 'project',
	scope: { include: ['**/*.md'], exclude: [], markdownOnly: true },
	resolver: { type: 'path-regex', pattern: '^([^/]+)', outputTemplate: '$1' },
	format: { type: 'text' },
};

describe('settings v2', () => {
	it('uses a flat declarative settings model', () => {
		const settings = defaultSettings();
		assert.equal(settings.schemaVersion, 2);
		assert.equal(settings.debounceMs, 750);
		assert.equal('defaults' in settings, false);
	});

	it('intentionally resets legacy data', () => {
		const settings = mergeSettings({ schemaVersion: 1, rules: [validRule] });
		assert.deepEqual(settings.rules, []);
		assert.equal(settings.schemaVersion, 2);
	});

	it('keeps valid v2 rules and repairs invalid scalar settings', () => {
		const settings = mergeSettings({
			...defaultSettings(),
			debounceMs: -1,
			rules: [validRule],
		});
		assert.equal(settings.debounceMs, 750);
		assert.equal(settings.rules.length, 1);
	});

	it('drops malformed managed state safely', () => {
		const settings = mergeSettings({
			...defaultSettings(),
			managedState: { entries: { 'note.md': { type: { ruleId: 42 } } } },
		});
		assert.deepEqual(settings.managedState, { entries: {} });
	});

	it('validates debounce and rule-specific fields', () => {
		assert.equal(validateDebounce(0), undefined);
		assert.match(validateDebounce(-1) ?? '', /greater than or equal/);
		assert.deepEqual(validateRule(validRule), []);
		assert.match(
			validateRule({ ...validRule, property: '', resolver: { type: 'path-regex', pattern: '[' } }).join(' '),
			/Property is required.*Regex pattern is invalid/,
		);
	});
});
