import { Setting } from 'obsidian';
import type { OnNoMatch, StructuralRule, WritePolicy } from '../../domain/rules';
import {
	ON_NO_MATCH,
	WRITE_POLICIES,
	toRecord,
	withDefault,
} from '../ruleOptions';

export function renderGeneralFields(container: HTMLElement, rule: StructuralRule): void {
	new Setting(container).setName('General').setHeading();
	new Setting(container)
		.setName('Name')
		.addText((text) => text.setValue(rule.name).onChange((value) => (rule.name = value)));
	new Setting(container)
		.setName('Property')
		.setDesc('Frontmatter property to set.')
		.addText((text) =>
			text.setValue(rule.property).onChange((value) => (rule.property = value)),
		);
	new Setting(container)
		.setName('Enabled')
		.addToggle((toggle) =>
			toggle.setValue(rule.enabled).onChange((value) => (rule.enabled = value)),
		);
	new Setting(container)
		.setName('Priority')
		.setDesc('Higher priority wins for the same property.')
		.addText((text) =>
			text.setValue(String(rule.priority)).onChange((value) => {
				const parsed = Number.parseInt(value, 10);
				rule.priority = Number.isNaN(parsed) ? 0 : parsed;
			}),
		);
	new Setting(container)
		.setName('Write policy')
		.addDropdown((dropdown) =>
			dropdown
				.addOptions(toRecord(withDefault(WRITE_POLICIES)))
				.setValue(rule.writePolicy ?? '')
				.onChange(
					(value) =>
						(rule.writePolicy = (value || undefined) as WritePolicy | undefined),
				),
		);
	new Setting(container)
		.setName('On no match')
		.addDropdown((dropdown) =>
			dropdown
				.addOptions(toRecord(withDefault(ON_NO_MATCH)))
				.setValue(rule.onNoMatch ?? '')
				.onChange(
					(value) =>
						(rule.onNoMatch = (value || undefined) as OnNoMatch | undefined),
				),
		);
}
