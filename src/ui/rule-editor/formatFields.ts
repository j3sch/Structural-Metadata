import { Setting } from 'obsidian';
import type { FormatConfig, FormatType, StructuralRule } from '../../domain/rules';
import { FORMAT_TYPES, LINK_STYLES, TRANSFORMS, toRecord } from '../ruleOptions';

export function renderFormatFields(container: HTMLElement, rule: StructuralRule): void {
	new Setting(container).setName('Format').setHeading();
	let section!: HTMLElement;
	new Setting(container)
		.setName('Format type')
		.addDropdown((dropdown) =>
			dropdown
				.addOptions(toRecord(FORMAT_TYPES))
				.setValue(rule.format.type)
				.onChange((value) => {
					rule.format = defaultFormat(value as FormatType);
					renderFormatSection(section, rule.format);
				}),
		);
	section = container.createDiv({ cls: 'structural-properties-subsection' });
	renderFormatSection(section, rule.format);
}

function renderFormatSection(container: HTMLElement, format: FormatConfig): void {
	container.empty();
	const addTransform = (
		value: Extract<FormatConfig, { transform?: unknown }>,
	): void => {
		new Setting(container)
			.setName('Transform')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(toRecord(TRANSFORMS))
					.setValue(value.transform ?? 'none')
					.onChange((next) => (value.transform = next as typeof value.transform)),
			);
	};
	switch (format.type) {
		case 'wikilink':
			new Setting(container)
				.setName('Link style')
				.addDropdown((dropdown) =>
					dropdown
						.addOptions(toRecord(LINK_STYLES))
						.setValue(format.style ?? 'full-path')
						.onChange((value) => (format.style = value as typeof format.style)),
				);
			new Setting(container)
				.setName('Alias')
				.addText((text) =>
					text
						.setValue(format.alias ?? '')
						.onChange((value) => (format.alias = value || undefined)),
				);
			addTransform(format);
			break;
		case 'text':
		case 'tag':
			addTransform(format);
			break;
		case 'list':
			new Setting(container)
				.setName('Delimiter')
				.addText((text) =>
					text
						.setValue(format.delimiter ?? ',')
						.onChange((value) => (format.delimiter = value)),
				);
			addTransform(format);
			break;
		case 'boolean':
		case 'number':
			container.createEl('p', { text: 'No extra options for this format type.' });
			break;
	}
}

function defaultFormat(type: FormatType): FormatConfig {
	switch (type) {
		case 'wikilink':
			return { type, style: 'full-path', transform: 'none' };
		case 'text':
		case 'tag':
			return { type, transform: 'none' };
		case 'list':
			return { type, delimiter: ',', transform: 'none' };
		case 'boolean':
		case 'number':
			return { type };
	}
}
