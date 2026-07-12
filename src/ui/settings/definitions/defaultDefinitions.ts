import type { SettingDefinitionItem } from 'obsidian';
import type { StructuralMetadataSettings } from '../../../domain/rules';
import { validateDebounce } from '../../../settings';
import { LINK_STYLES, ON_NO_MATCH, WRITE_POLICIES, toRecord } from '../../ruleOptions';

type SettingKey = keyof StructuralMetadataSettings;

export function buildDefaultDefinitions(): SettingDefinitionItem<SettingKey>[] {
	return [
		{
			type: 'group',
			heading: 'Defaults',
			items: [
				{
					name: 'Debounce delay',
					desc: 'Delay before processing a batch of file changes, in milliseconds.',
					aliases: ['delay', 'batch processing'],
					control: {
						type: 'number',
						key: 'debounceMs',
						defaultValue: 750,
						min: 0,
						step: 50,
						validate: validateDebounce,
					},
				},
				{
					name: 'Default write policy',
					desc: 'Controls when a matching rule may replace an existing value.',
					control: {
						type: 'dropdown',
						key: 'writePolicy',
						defaultValue: 'managed',
						options: toRecord(WRITE_POLICIES),
					},
				},
				{
					name: 'Default on no match',
					desc: 'Controls what happens when a managed rule no longer matches.',
					control: {
						type: 'dropdown',
						key: 'onNoMatch',
						defaultValue: 'clear-managed',
						options: toRecord(ON_NO_MATCH),
					},
				},
				{
					name: 'Default link style',
					desc: 'Controls how generated links are written.',
					control: {
						type: 'dropdown',
						key: 'linkStyle',
						defaultValue: 'full-path',
						options: toRecord(LINK_STYLES),
					},
				},
			],
		},
	];
}
