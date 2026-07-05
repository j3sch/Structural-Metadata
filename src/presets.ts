import type { StructuralRule } from './types';
import { generateRuleId } from './settings';

export interface RulePreset {
	id: string;
	name: string;
	description: string;
	build: () => StructuralRule;
}

/** Built-in rule presets shown in the settings UI. */
export const RULE_PRESETS: RulePreset[] = [
	{
		id: 'preset-link-to-parent-folder-note',
		name: 'Link to parent folder note',
		description:
			'Adds a link property pointing to the folder note of the containing folder.',
		build: (): StructuralRule => ({
			id: generateRuleId(),
			name: 'Link to parent folder note',
			enabled: true,
			priority: 100,
			property: 'link',
			scope: {
				include: ['**/*.md'],
				exclude: [],
				markdownOnly: true,
			},
			resolver: {
				type: 'parent-folder-note',
				folderNoteSelfBehavior: 'parent-folder-note',
			},
			format: { type: 'wikilink', style: 'full-path' },
			writePolicy: 'managed',
			onNoMatch: 'clear-managed',
		}),
	},
	{
		id: 'preset-project-from-ancestor',
		name: 'Project/collection from ancestor folder note',
		description:
			'Sets a property to the folder note at a configured level below a root folder (e.g. the project under "01 Projects").',
		build: (): StructuralRule => ({
			id: generateRuleId(),
			name: 'Project from ancestor folder note',
			enabled: true,
			priority: 100,
			property: 'project',
			scope: {
				include: ['01 Projects/**'],
				exclude: [],
				minDepthBelowRoot: 1,
				markdownOnly: true,
			},
			resolver: {
				type: 'ancestor-folder-note',
				root: '01 Projects',
				levelBelowRoot: 1,
				folderNoteSelfBehavior: 'parent-folder-note',
			},
			format: { type: 'wikilink', style: 'full-path' },
			writePolicy: 'managed',
			onNoMatch: 'clear-managed',
		}),
	},
	{
		id: 'preset-inherit-nearest',
		name: 'Inherit property from nearest folder note',
		description:
			'Copies a property value from the nearest ancestor folder note that defines it.',
		build: (): StructuralRule => ({
			id: generateRuleId(),
			name: 'Inherit property from nearest folder note',
			enabled: true,
			priority: 80,
			property: 'inherited',
			scope: {
				include: ['**/*.md'],
				exclude: [],
				markdownOnly: true,
			},
			resolver: {
				type: 'inherit-property',
				searchMode: 'nearest',
				sourceProperty: 'status',
				folderNoteSelfBehavior: 'parent-folder-note',
			},
			format: { type: 'text', transform: 'none' },
			writePolicy: 'managed',
			onNoMatch: 'clear-managed',
		}),
	},
	{
		id: 'preset-static-by-folder',
		name: 'Static property by folder',
		description:
			'Sets a fixed value on every file inside a folder scope.',
		build: (): StructuralRule => ({
			id: generateRuleId(),
			name: 'Static property by folder',
			enabled: true,
			priority: 50,
			property: 'type',
			scope: {
				include: ['00 Inbox/**'],
				exclude: [],
				markdownOnly: true,
			},
			resolver: { type: 'static', value: 'inbox' },
			format: { type: 'text', transform: 'none' },
			writePolicy: 'empty-only',
			onNoMatch: 'ignore',
		}),
	},
	{
		id: 'preset-path-regex',
		name: 'Path regex property',
		description:
			'Extracts a property value from the file path using a regex with capture groups.',
		build: (): StructuralRule => ({
			id: generateRuleId(),
			name: 'Path regex property',
			enabled: true,
			priority: 60,
			property: 'area',
			scope: {
				include: ['**/*.md'],
				exclude: [],
				markdownOnly: true,
			},
			resolver: {
				type: 'path-regex',
				pattern: '^([^/]+)',
				outputTemplate: '$1',
			},
			format: { type: 'text', transform: 'none' },
			writePolicy: 'empty-only',
			onNoMatch: 'ignore',
		}),
	},
];
