import { App, Modal, Setting } from 'obsidian';
import type {
	FormatType,
	OnNoMatch,
	ResolverType,
	StructuralRule,
	WritePolicy,
} from '../types';
import {
	FORMAT_TYPES,
	LINK_STYLES,
	ON_NO_MATCH,
	RESOLVER_TYPES,
	SEARCH_MODES,
	SEGMENT_SOURCES,
	SELF_BEHAVIORS,
	TRANSFORMS,
	WRITE_POLICIES,
	cloneRule,
	splitLines,
	toRecord,
	withDefault,
} from './ruleOptions';

/**
 * Modal for editing a single {@link StructuralRule}. Resolver- and
 * format-specific fields are re-rendered when the type dropdown changes.
 */
export class RuleEditorModal extends Modal {
	private rule: StructuralRule;
	private onSave: (rule: StructuralRule) => void;
	private resolverSectionEl!: HTMLElement;
	private formatSectionEl!: HTMLElement;

	constructor(
		app: App,
		rule: StructuralRule,
		onSave: (rule: StructuralRule) => void,
	) {
		super(app);
		this.rule = cloneRule(rule);
		this.onSave = onSave;
		this.setTitle('Edit rule');
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		new Setting(contentEl).setName('General').setHeading();

		new Setting(contentEl)
			.setName('Name')
			.addText((t) => t.setValue(this.rule.name).onChange((v) => (this.rule.name = v)));

		new Setting(contentEl)
			.setName('Property')
			.setDesc('Frontmatter property to set.')
			.addText((t) => t.setValue(this.rule.property).onChange((v) => (this.rule.property = v)));

		new Setting(contentEl)
			.setName('Enabled')
			.addToggle((tg) => tg.setValue(this.rule.enabled).onChange((v) => (this.rule.enabled = v)));

		new Setting(contentEl)
			.setName('Priority')
			.setDesc('Higher priority wins for the same property.')
			.addText((t) =>
				t.setValue(String(this.rule.priority)).onChange((v) => {
					const n = parseInt(v, 10);
					this.rule.priority = Number.isNaN(n) ? 0 : n;
				}),
			);

		new Setting(contentEl)
			.setName('Write policy')
			.addDropdown((d) =>
				d
					.addOptions(toRecord(withDefault(WRITE_POLICIES)))
					.setValue(this.rule.writePolicy ?? '')
					.onChange((v) => (this.rule.writePolicy = (v || undefined) as WritePolicy | undefined)),
			);

		new Setting(contentEl)
			.setName('On no match')
			.addDropdown((d) =>
				d
					.addOptions(toRecord(withDefault(ON_NO_MATCH)))
					.setValue(this.rule.onNoMatch ?? '')
					.onChange((v) => (this.rule.onNoMatch = (v || undefined) as OnNoMatch | undefined)),
			);

		new Setting(contentEl).setName('Scope').setHeading();

		new Setting(contentEl)
			.setName('Include patterns')
			.setDesc('One glob per line, e.g. "projects/**".')
			.addTextArea((ta) =>
				ta.setValue(this.rule.scope.include.join('\n')).onChange((v) => (this.rule.scope.include = splitLines(v))),
			);

		new Setting(contentEl)
			.setName('Exclude patterns')
			.setDesc('One glob per line.')
			.addTextArea((ta) =>
				ta.setValue(this.rule.scope.exclude.join('\n')).onChange((v) => (this.rule.scope.exclude = splitLines(v))),
			);

		new Setting(contentEl)
			.setName('Min depth below root')
			.setDesc('Minimum number of parent folders (0 = anywhere).')
			.addText((t) =>
				t
					.setValue(this.rule.scope.minDepthBelowRoot != null ? String(this.rule.scope.minDepthBelowRoot) : '')
					.onChange((v) => {
						const n = parseInt(v, 10);
						this.rule.scope.minDepthBelowRoot = Number.isNaN(n) ? undefined : n;
					}),
			);

		new Setting(contentEl)
			.setName('Markdown files only')
			.addToggle((tg) => tg.setValue(this.rule.scope.markdownOnly).onChange((v) => (this.rule.scope.markdownOnly = v)));

		new Setting(contentEl).setName('Resolver').setHeading();

		new Setting(contentEl)
			.setName('Resolver type')
			.addDropdown((d) =>
				d
					.addOptions(toRecord(RESOLVER_TYPES))
					.setValue(this.rule.resolver.type)
					.onChange((v) => {
						this.rule.resolver.type = v as ResolverType;
						this.renderResolverSection();
					}),
			);

		this.resolverSectionEl = contentEl.createDiv({ cls: 'structural-metadata-subsection' });
		this.renderResolverSection();

		new Setting(contentEl).setName('Format').setHeading();

		new Setting(contentEl)
			.setName('Format type')
			.addDropdown((d) =>
				d
					.addOptions(toRecord(FORMAT_TYPES))
					.setValue(this.rule.format.type)
					.onChange((v) => {
						this.rule.format.type = v as FormatType;
						this.renderFormatSection();
					}),
			);

		this.formatSectionEl = contentEl.createDiv({ cls: 'structural-metadata-subsection' });
		this.renderFormatSection();

		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText('Save').setCta().onClick(() => {
					this.onSave(this.rule);
					this.close();
				}),
			)
			.addButton((btn) => btn.setButtonText('Cancel').onClick(() => this.close()));
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private renderResolverSection(): void {
		const el = this.resolverSectionEl;
		el.empty();
		const r = this.rule.resolver;

		const addSelfBehavior = () => {
			new Setting(el)
				.setName('Folder-note self behavior')
				.setDesc('When the file itself is the folder note.')
				.addDropdown((d) =>
					d
						.addOptions(toRecord(SELF_BEHAVIORS))
						.setValue(r.folderNoteSelfBehavior ?? 'parent-folder-note')
						.onChange((v) => (r.folderNoteSelfBehavior = v as typeof r.folderNoteSelfBehavior)),
				);
		};

		switch (r.type) {
			case 'parent-folder-note':
			case 'nearest-folder-note':
				addSelfBehavior();
				break;

			case 'ancestor-folder-note':
				new Setting(el)
					.setName('Root folder')
					.setDesc('Vault path of the root, e.g. "projects".')
					.addText((t) => t.setValue(r.root ?? '').onChange((v) => (r.root = v)));
				new Setting(el)
					.setName('Level below root')
					.setDesc('How many folders down the target note sits (1 = direct child).')
					.addText((t) =>
						t.setValue(String(r.levelBelowRoot ?? 1)).onChange((v) => {
							const n = parseInt(v, 10);
							r.levelBelowRoot = Number.isNaN(n) ? 1 : n;
						}),
					);
				addSelfBehavior();
				break;

			case 'path-segment':
				new Setting(el)
					.setName('Segment source')
					.addDropdown((d) =>
						d
							.addOptions(toRecord(SEGMENT_SOURCES))
							.setValue(r.segmentSource ?? 'current-folder')
							.onChange((v) => {
								r.segmentSource = v as 'from-root' | 'current-folder';
								this.renderResolverSection();
							}),
					);
				if (r.segmentSource === 'from-root') {
					new Setting(el)
						.setName('Segment index')
						.setDesc('0-based folder index from the vault root.')
						.addText((t) =>
							t.setValue(String(r.segmentIndex ?? 0)).onChange((v) => {
								const n = parseInt(v, 10);
								r.segmentIndex = Number.isNaN(n) ? 0 : n;
							}),
						);
				}
				break;

			case 'path-regex':
				new Setting(el)
					.setName('Regex pattern')
					.setDesc('Matched against the full vault path. Use capture groups.')
					.addText((t) => t.setValue(r.pattern ?? '').onChange((v) => (r.pattern = v)));
				new Setting(el)
					.setName('Output template')
					.setDesc('Use $1, $2… or ${name} for named groups. Default $0.')
					.addText((t) => t.setValue(r.outputTemplate ?? '').onChange((v) => (r.outputTemplate = v)));
				break;

			case 'inherit-property':
				new Setting(el)
					.setName('Source property')
					.setDesc('Property to copy from the folder note.')
					.addText((t) => t.setValue(r.sourceProperty ?? '').onChange((v) => (r.sourceProperty = v)));
				new Setting(el)
					.setName('Search mode')
					.addDropdown((d) =>
						d
							.addOptions(toRecord(SEARCH_MODES))
							.setValue(r.searchMode ?? 'parent')
							.onChange((v) => (r.searchMode = v as 'parent' | 'nearest')),
					);
				addSelfBehavior();
				break;

			case 'static':
				new Setting(el)
					.setName('Static value')
					.setDesc('Value to set (coerced by the format type).')
					.addText((t) =>
						t
							.setValue(typeof r.value === 'string' ? r.value : '')
							.onChange((v) => (r.value = v)),
					);
				break;
		}
	}

	private renderFormatSection(): void {
		const el = this.formatSectionEl;
		el.empty();
		const f = this.rule.format;

		const addTransform = () => {
			new Setting(el)
				.setName('Transform')
				.addDropdown((d) =>
					d
						.addOptions(toRecord(TRANSFORMS))
						.setValue(f.transform ?? 'none')
						.onChange((v) => (f.transform = v as typeof f.transform)),
				);
		};

		switch (f.type) {
			case 'wikilink':
				new Setting(el)
					.setName('Link style')
					.addDropdown((d) =>
						d
							.addOptions(toRecord(LINK_STYLES))
							.setValue(f.style ?? 'full-path')
							.onChange((v) => (f.style = v as typeof f.style)),
					);
				new Setting(el)
					.setName('Alias')
					.setDesc('Optional display text for the link.')
					.addText((t) => t.setValue(f.alias ?? '').onChange((v) => (f.alias = v || undefined)));
				addTransform();
				break;

			case 'text':
				addTransform();
				break;

			case 'list':
				new Setting(el)
					.setName('Delimiter')
					.setDesc('Used to split a string value into a list.')
					.addText((t) => t.setValue(f.delimiter ?? ',').onChange((v) => (f.delimiter = v)));
				addTransform();
				break;

			case 'tag':
				addTransform();
				break;

			case 'boolean':
			case 'number':
			default:
				el.createEl('p', { text: 'No extra options for this format type.' });
				break;
		}
	}
}
