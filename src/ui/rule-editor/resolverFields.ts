import { Setting } from 'obsidian';
import type { ResolverConfig, ResolverType, StructuralRule } from '../../domain/rules';
import {
	RESOLVER_TYPES,
	SEARCH_MODES,
	SEGMENT_SOURCES,
	SELF_BEHAVIORS,
	toRecord,
} from '../ruleOptions';

export function renderResolverFields(container: HTMLElement, rule: StructuralRule): void {
	new Setting(container).setName('Resolver').setHeading();
	let section!: HTMLElement;
	new Setting(container)
		.setName('Resolver type')
		.addDropdown((dropdown) =>
			dropdown
				.addOptions(toRecord(RESOLVER_TYPES))
				.setValue(rule.resolver.type)
				.onChange((value) => {
					rule.resolver = defaultResolver(value as ResolverType);
					renderResolverSection(section, rule);
				}),
		);
	section = container.createDiv({ cls: 'structural-properties-subsection' });
	renderResolverSection(section, rule);
}

function renderResolverSection(container: HTMLElement, rule: StructuralRule): void {
	container.empty();
	const resolver = rule.resolver;
	const addSelfBehavior = (
		value: Extract<ResolverConfig, { folderNoteSelfBehavior?: unknown }>,
	): void => {
		new Setting(container)
			.setName('Folder-note self behavior')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(toRecord(SELF_BEHAVIORS))
					.setValue(value.folderNoteSelfBehavior ?? 'parent-folder-note')
					.onChange(
						(next) =>
							(value.folderNoteSelfBehavior = next as typeof value.folderNoteSelfBehavior),
					),
			);
	};

	switch (resolver.type) {
		case 'parent-folder-note':
		case 'nearest-folder-note':
			addSelfBehavior(resolver);
			break;
		case 'ancestor-folder-note':
			new Setting(container)
				.setName('Root folder')
				.addText((text) =>
					text.setValue(resolver.root).onChange((value) => (resolver.root = value)),
				);
			new Setting(container)
				.setName('Level below root')
				.addText((text) =>
					text.setValue(String(resolver.levelBelowRoot)).onChange((value) => {
						const parsed = Number.parseInt(value, 10);
						resolver.levelBelowRoot = Number.isNaN(parsed) ? 1 : Math.max(1, parsed);
					}),
				);
			addSelfBehavior(resolver);
			break;
		case 'path-segment':
			new Setting(container)
				.setName('Segment source')
				.addDropdown((dropdown) =>
					dropdown
						.addOptions(toRecord(SEGMENT_SOURCES))
						.setValue(resolver.segmentSource)
						.onChange((value) => {
							resolver.segmentSource = value as typeof resolver.segmentSource;
							renderResolverSection(container, rule);
						}),
				);
			if (resolver.segmentSource === 'from-root') {
				new Setting(container)
					.setName('Segment index')
					.addText((text) =>
						text.setValue(String(resolver.segmentIndex ?? 0)).onChange((value) => {
							const parsed = Number.parseInt(value, 10);
							resolver.segmentIndex = Number.isNaN(parsed) ? 0 : parsed;
						}),
					);
			}
			break;
		case 'path-regex':
			new Setting(container)
				.setName('Regex pattern')
				.addText((text) =>
					text.setValue(resolver.pattern).onChange((value) => (resolver.pattern = value)),
				);
			new Setting(container)
				.setName('Output template')
				.addText((text) =>
					text
						.setValue(resolver.outputTemplate ?? '')
						.onChange((value) => (resolver.outputTemplate = value)),
				);
			break;
		case 'inherit-property':
			new Setting(container)
				.setName('Source property')
				.addText((text) =>
					text
						.setValue(resolver.sourceProperty)
						.onChange((value) => (resolver.sourceProperty = value)),
				);
			new Setting(container)
				.setName('Search mode')
				.addDropdown((dropdown) =>
					dropdown
						.addOptions(toRecord(SEARCH_MODES))
						.setValue(resolver.searchMode)
						.onChange((value) => (resolver.searchMode = value as typeof resolver.searchMode)),
				);
			addSelfBehavior(resolver);
			break;
		case 'static':
			new Setting(container)
				.setName('Static value')
				.addText((text) =>
					text
						.setValue(typeof resolver.value === 'string' ? resolver.value : '')
						.onChange((value) => (resolver.value = value)),
				);
			break;
	}
}

function defaultResolver(type: ResolverType): ResolverConfig {
	switch (type) {
		case 'parent-folder-note':
		case 'nearest-folder-note':
			return { type, folderNoteSelfBehavior: 'parent-folder-note' };
		case 'ancestor-folder-note':
			return {
				type,
				root: '',
				levelBelowRoot: 1,
				folderNoteSelfBehavior: 'parent-folder-note',
			};
		case 'path-segment':
			return { type, segmentSource: 'current-folder' };
		case 'path-regex':
			return { type, pattern: '', outputTemplate: '$0' };
		case 'inherit-property':
			return {
				type,
				sourceProperty: '',
				searchMode: 'parent',
				folderNoteSelfBehavior: 'parent-folder-note',
			};
		case 'static':
			return { type, value: '' };
	}
}
