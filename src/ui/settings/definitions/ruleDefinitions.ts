import { Notice, type App, type SettingDefinitionItem } from 'obsidian';
import type { SettingsController } from '../../../application/SettingsController';
import { RULE_PRESETS } from '../../../presets';
import { RuleEditorModal } from '../../rule-editor/RuleEditorModal';
import { createEmptyRule } from '../../rule-editor/defaultRule';

export function buildRuleDefinitions(
	app: App,
	controller: SettingsController,
	refresh: () => void,
): SettingDefinitionItem[] {
	const sortedRules = [...controller.settings.rules].sort((a, b) => b.priority - a.priority);
	return [
		{
			name: 'Add rule from preset',
			desc: 'Create a rule from a built-in starting point.',
			aliases: ['preset', 'new rule'],
			render: (setting) => {
				setting.addDropdown((dropdown) => {
					dropdown.addOption('', '— choose a preset —');
					for (const preset of RULE_PRESETS) dropdown.addOption(preset.id, preset.name);
					dropdown.onChange(async (presetId) => {
						const preset = RULE_PRESETS.find((candidate) => candidate.id === presetId);
						if (!preset) return;
						await controller.addRule(preset.build());
						refresh();
					});
				});
			},
		},
		{
			type: 'list',
			heading: 'Rules',
			emptyState: 'No rules yet. Add a rule or choose a preset.',
			search: {
				placeholder: 'Filter rules',
				match: (definition, query) =>
					definition.name.toLowerCase().includes(query.trim().toLowerCase()),
			},
			items: sortedRules.map((rule) => ({
				name: rule.name || '(unnamed)',
				desc: `Property: ${rule.property || '—'} · Resolver: ${rule.resolver.type} · Priority: ${rule.priority}`,
				aliases: [rule.property, rule.resolver.type],
				render: (setting) => {
					setting
						.addToggle((toggle) =>
							toggle.setValue(rule.enabled).onChange(async (enabled) => {
								await controller.setRuleEnabled(rule.id, enabled);
							}),
						)
						.addButton((button) =>
							button.setButtonText('Edit').onClick(() => {
								new RuleEditorModal(app, rule, (updated) => {
									void controller.updateRule(updated).then(refresh).catch(showError);
								}).open();
							}),
						);
				},
			})),
			onDelete: (index) => {
				const rule = sortedRules[index];
				if (rule) void controller.deleteRule(rule.id).then(refresh).catch(showError);
			},
			addItem: {
				name: 'Add rule',
				action: () => {
					new RuleEditorModal(app, createEmptyRule(), (rule) => {
						void controller.addRule(rule).then(refresh).catch(showError);
					}).open();
				},
			},
		},
	];
}

function showError(error: unknown): void {
	new Notice(`Structural properties: ${(error as Error).message}`, 5000);
}
