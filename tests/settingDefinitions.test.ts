import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SettingDefinitionGroup } from 'obsidian';
import { buildDefaultDefinitions } from '../src/ui/settings/definitions/defaultDefinitions';

describe('declarative setting definitions', () => {
	it('exposes stable searchable default settings', () => {
		const definitions = buildDefaultDefinitions();
		assert.equal(definitions.length, 1);
		const group = definitions[0] as SettingDefinitionGroup;
		assert.equal(group.heading, 'Defaults');
		assert.deepEqual(
			group.items?.map((item) => item.name),
			[
				'Debounce delay',
				'Default write policy',
				'Default on no match',
				'Default link style',
			],
		);
	});
});
