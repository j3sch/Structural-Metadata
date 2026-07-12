import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RuleService } from '../src/application/RuleService';
import { ManagedStateStore } from '../src/domain/ManagedStateStore';
import { defaultSettings } from '../src/settings';
import type { StructuralRule } from '../src/domain/rules';

const rule: StructuralRule = {
	id: 'rule-1',
	name: 'Static',
	enabled: true,
	priority: 1,
	property: 'type',
	scope: { include: ['**/*.md'], exclude: [], markdownOnly: true },
	resolver: { type: 'static', value: 'note' },
	format: { type: 'text' },
};

describe('RuleService', () => {
	it('deletes a rule and its tracking without touching frontmatter', async () => {
		const settings = defaultSettings();
		settings.rules = [rule];
		const state = new ManagedStateStore();
		state.recordWrite('note.md', 'type', rule.id, 'hash');
		let saves = 0;
		const service = new RuleService(() => settings, state, async () => {
			saves++;
		});

		await service.deleteRule(rule.id);

		assert.deepEqual(settings.rules, []);
		assert.equal(state.getEntry('note.md', 'type'), null);
		assert.equal(saves, 1);
	});

	it('rejects invalid rules before mutating settings', async () => {
		const settings = defaultSettings();
		const service = new RuleService(
			() => settings,
			new ManagedStateStore(),
			async () => undefined,
		);
		await assert.rejects(service.addRule({ ...rule, property: '' }), /Property is required/);
		assert.deepEqual(settings.rules, []);
	});
});
