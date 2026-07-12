import type { SettingDefinitionItem, SettingDefinitionList } from 'obsidian';
import type { SettingsController } from '../../../application/SettingsController';

export function buildPatternDefinitions(
	controller: SettingsController,
	refresh: () => void,
): SettingDefinitionItem[] {
	return [
		buildPatternList(
			'Exclude patterns',
			'Global globs excluded from all processing.',
			controller.settings.excludePatterns,
			(patterns) => controller.setExcludePatterns(patterns),
			refresh,
			'path/**',
		),
		buildPatternList(
			'Folder note detection',
			'Patterns used to locate folder notes. Use {{folderPath}} and {{folderName}}.',
			controller.settings.folderNotePatterns,
			(patterns) => controller.setFolderNotePatterns(patterns),
			refresh,
			'{{folderPath}}/{{folderName}}.md',
		),
	];
}

function buildPatternList(
	heading: string,
	description: string,
	patterns: string[],
	save: (patterns: string[]) => Promise<void>,
	refresh: () => void,
	newPattern: string,
): SettingDefinitionList {
	return {
		type: 'list',
		heading,
		emptyState: 'No patterns configured.',
		items: patterns.map((pattern, index) => ({
			name: `Pattern ${index + 1}`,
			desc: description,
			render: (setting) => {
				setting.addText((text) =>
					text.setValue(pattern).onChange(async (value) => {
						const next = [...patterns];
						next[index] = value.trim();
						await save(next);
					}),
				);
			},
		})),
		onDelete: (index) => {
			void save(patterns.filter((_, candidate) => candidate !== index)).then(refresh);
		},
		addItem: {
			name: 'Add pattern',
			action: () => void save([...patterns, newPattern]).then(refresh),
		},
	};
}
