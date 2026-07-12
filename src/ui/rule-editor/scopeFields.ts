import { Setting } from 'obsidian';
import type { StructuralRule } from '../../domain/rules';
import { splitLines } from '../ruleOptions';

export function renderScopeFields(container: HTMLElement, rule: StructuralRule): void {
	new Setting(container).setName('Scope').setHeading();
	new Setting(container)
		.setName('Include patterns')
		.setDesc('One glob per line, e.g. "projects/**".')
		.addTextArea((area) =>
			area
				.setValue(rule.scope.include.join('\n'))
				.onChange((value) => (rule.scope.include = splitLines(value))),
		);
	new Setting(container)
		.setName('Exclude patterns')
		.setDesc('One glob per line.')
		.addTextArea((area) =>
			area
				.setValue(rule.scope.exclude.join('\n'))
				.onChange((value) => (rule.scope.exclude = splitLines(value))),
		);
	new Setting(container)
		.setName('Min depth below root')
		.setDesc('Minimum number of parent folders (0 = anywhere).')
		.addText((text) =>
			text
				.setValue(
					rule.scope.minDepthBelowRoot === undefined
						? ''
						: String(rule.scope.minDepthBelowRoot),
				)
				.onChange((value) => {
					const parsed = Number.parseInt(value, 10);
					rule.scope.minDepthBelowRoot = Number.isNaN(parsed) ? undefined : parsed;
				}),
		);
	new Setting(container)
		.setName('Markdown files only')
		.addToggle((toggle) =>
			toggle
				.setValue(rule.scope.markdownOnly)
				.onChange((value) => (rule.scope.markdownOnly = value)),
		);
}
