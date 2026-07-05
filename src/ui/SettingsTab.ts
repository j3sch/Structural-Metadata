import { App, PluginSettingTab, Setting } from 'obsidian';
import type { StructuralRule } from '../types';
import type StructuralMetadataPlugin from '../main';
import {
	LINK_STYLES,
	ON_NO_MATCH,
	WRITE_POLICIES,
	splitLines,
	toRecord,
} from './ruleOptions';
import { RULE_PRESETS } from '../presets';
import { generateRuleId } from '../settings';
import { RuleEditorModal } from './RuleEditorModal';

function emptyRule(): StructuralRule {
	return {
		id: generateRuleId(),
		name: 'New rule',
		enabled: true,
		priority: 50,
		property: '',
		scope: { include: ['**/*.md'], exclude: [], markdownOnly: true },
		resolver: { type: 'parent-folder-note', folderNoteSelfBehavior: 'parent-folder-note' },
		format: { type: 'wikilink', style: 'full-path' },
	};
}

export class StructuralMetadataSettingsTab extends PluginSettingTab {
	private plugin: StructuralMetadataPlugin;

	constructor(app: App, plugin: StructuralMetadataPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.renderDefaults(containerEl);
		this.renderRules(containerEl);
		this.renderTestPath(containerEl);
		this.renderManagedState(containerEl);
		this.renderSafetyNote(containerEl);
	}

	private renderDefaults(el: HTMLElement): void {
		new Setting(el).setName('Defaults').setHeading();

		const d = this.plugin.settings.defaults;

		new Setting(el)
			.setName('Debounce (ms)')
			.setDesc('Delay before processing a batch of file changes.')
			.addText((t) =>
				t
					.setValue(String(d.debounceMs))
					.onChange(async (v) => {
						const n = parseInt(v, 10);
						d.debounceMs = Number.isNaN(n) ? 750 : Math.max(0, n);
						await this.plugin.saveSettings();
					}),
			);

		new Setting(el)
			.setName('Default write policy')
			.addDropdown((dd) =>
				dd
					.addOptions(toRecord(WRITE_POLICIES))
					.setValue(d.writePolicy)
					.onChange(async (v) => {
						d.writePolicy = v as typeof d.writePolicy;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(el)
			.setName('Default on no match')
			.addDropdown((dd) =>
				dd
					.addOptions(toRecord(ON_NO_MATCH))
					.setValue(d.onNoMatch)
					.onChange(async (v) => {
						d.onNoMatch = v as typeof d.onNoMatch;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(el)
			.setName('Default link style')
			.addDropdown((dd) =>
				dd
					.addOptions(toRecord(LINK_STYLES))
					.setValue(d.linkStyle)
					.onChange(async (v) => {
						d.linkStyle = v as typeof d.linkStyle;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(el)
			.setName('Exclude patterns')
			.setDesc('Global globs excluded from all processing. One per line.')
			.addTextArea((ta) =>
				ta
					.setValue(d.excludePatterns.join('\n'))
					.onChange(async (v) => {
						d.excludePatterns = splitLines(v);
						await this.plugin.saveSettings();
					}),
			);

		new Setting(el)
			.setName('Folder note patterns')
			.setDesc('Templates used to detect folder notes. Use {{folderPath}} and {{folderName}}.')
			.addTextArea((ta) =>
				ta
					.setValue(this.plugin.settings.folderNotePatterns.join('\n'))
					.onChange(async (v) => {
						this.plugin.settings.folderNotePatterns = splitLines(v);
						await this.plugin.saveSettings();
					}),
			);
	}

	private renderRules(el: HTMLElement): void {
		new Setting(el).setName('Rules').setHeading();

		new Setting(el)
			.setName('Add rule')
			.setDesc('Create a blank rule and edit it.')
			.addButton((btn) =>
				btn.setButtonText('Add rule').onClick(() => {
					const rule = emptyRule();
					new RuleEditorModal(this.app, rule, (saved) => {
						this.plugin.settings.rules.push(saved);
						void this.plugin.saveSettings().then(() => this.display());
					}).open();
				}),
			);

		new Setting(el)
			.setName('Add from preset')
			.addDropdown((dd) => {
				dd.addOption('', '— choose a preset —');
				for (const preset of RULE_PRESETS) {
					dd.addOption(preset.id, preset.name);
				}
				dd.onChange(async (value) => {
					const preset = RULE_PRESETS.find((p) => p.id === value);
					if (preset) {
						this.plugin.settings.rules.push(preset.build());
						await this.plugin.saveSettings();
						this.display();
					}
				});
			});

		const rules = [...this.plugin.settings.rules].sort((a, b) => b.priority - a.priority);
		if (rules.length === 0) {
			el.createEl('p', {
				text: 'No rules yet. Add a rule or pick a preset above.',
				cls: 'structural-metadata-muted',
			});
			return;
		}

		for (const rule of rules) {
			const setting = new Setting(el)
				.setName(rule.name || '(unnamed)')
				.setDesc(
					`property: ${rule.property || '—'} · resolver: ${rule.resolver.type} · priority: ${rule.priority}`,
				);

			setting.addToggle((tg) =>
				tg
					.setValue(rule.enabled)
					.onChange(async (v) => {
						rule.enabled = v;
						await this.plugin.saveSettings();
					}),
			);

			setting.addButton((btn) =>
				btn.setButtonText('Edit').onClick(() => {
					new RuleEditorModal(this.app, rule, (saved) => {
						const idx = this.plugin.settings.rules.findIndex((r) => r.id === rule.id);
						if (idx >= 0) {
							this.plugin.settings.rules[idx] = saved;
							void this.plugin.saveSettings().then(() => this.display());
						}
					}).open();
				}),
			);

			setting.addButton((btn) =>
				btn
					.setButtonText('Delete')
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.rules = this.plugin.settings.rules.filter(
							(r) => r.id !== rule.id,
						);
						await this.plugin.saveSettings();
						this.display();
					}),
			);
		}
	}

	private renderTestPath(el: HTMLElement): void {
		new Setting(el).setName('Test path').setHeading();

		const resultEl = el.createDiv({ cls: 'structural-metadata-test-result' });
		let currentPath = '';

		new Setting(el)
			.setName('Sample file path')
			.setDesc('Enter a vault path (e.g. "01 Projects/Captzy/note.md") to preview which rules match.')
			.addText((t) =>
				t.setPlaceholder('path/to/note.md').onChange((v) => (currentPath = v.trim())),
			)
			.addButton((btn) =>
				btn.setButtonText('Evaluate').onClick(async () => {
					resultEl.empty();
					if (!currentPath) {
						resultEl.createEl('p', { text: 'Enter a path first.' });
						return;
					}
					resultEl.createEl('p', { text: 'Evaluating…' });
					try {
						const changes = await this.plugin.processor.planPaths([currentPath]);
						this.renderTestResults(resultEl, changes);
					} catch (err) {
						resultEl.empty();
						resultEl.createEl('p', {
							text: `Error: ${(err as Error).message}`,
						});
					}
				}),
			);
	}

	private renderTestResults(el: HTMLElement, changes: import('../types').PlannedChange[]): void {
		el.empty();
		if (changes.length === 0) {
			el.createEl('p', { text: 'No rules matched this path.' });
			return;
		}
		const table = el.createEl('table', { cls: 'structural-metadata-dryrun-table' });
		const thead = table.createEl('thead').createEl('tr');
		for (const h of ['Property', 'Old', 'New', 'Action', 'Conflict', 'Reason']) {
			thead.createEl('th', { text: h });
		}
		const tbody = table.createEl('tbody');
		for (const c of changes) {
			const row = tbody.createEl('tr');
			row.createEl('td', { text: c.property });
			row.createEl('td', { text: renderValue(c.oldValue) });
			row.createEl('td', { text: renderValue(c.newValue) });
			row.createEl('td', { text: c.action });
			row.createEl('td', { text: c.conflict });
			row.createEl('td', { text: c.reason });
		}
	}

	private renderManagedState(el: HTMLElement): void {
		new Setting(el).setName('Managed state').setHeading();

		new Setting(el)
			.setName('Tracked files')
			.setDesc(`The plugin currently manages frontmatter for ${this.plugin.managedState.size} file(s).`)
			.addButton((btn) =>
				btn
					.setButtonText('Clean managed state')
					.setWarning()
					.onClick(async () => {
						await this.plugin.cleanManagedState();
						this.display();
					}),
			);
	}

	private renderSafetyNote(el: HTMLElement): void {
		const note = el.createDiv({ cls: 'structural-metadata-safety-note' });
		note.createEl('strong', { text: 'Safety: ' });
		note.appendText(
			'Vault-wide writes only happen through the refresh commands. Run a dry run first and review the planned changes before applying to the entire vault.',
		);
	}
}

function renderValue(value: unknown): string {
	if (value === undefined) return '—';
	if (value === null) return 'null';
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	if (Array.isArray(value)) return '[' + value.map(renderValue).join(', ') + ']';
	try {
		return JSON.stringify(value);
	} catch {
		return '[unserializable]';
	}
}
