import { App, ButtonComponent, Modal, Setting } from 'obsidian';
import type { PlannedChange } from '../types';

/**
 * Modal that displays planned frontmatter changes in a table and optionally
 * applies them. Used by the dry-run commands.
 */
export class DryRunModal extends Modal {
	private changes: PlannedChange[];
	private onApply: () => Promise<void>;

	constructor(
		app: App,
		changes: PlannedChange[],
		onApply: () => Promise<void>,
	) {
		super(app);
		this.changes = changes;
		this.onApply = onApply;
		this.setTitle('Structural metadata — dry run');
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		const actionable = this.changes.filter(
			(c) => c.action === 'set' || c.action === 'clear',
		);

		if (this.changes.length === 0) {
			contentEl.createEl('p', {
				text: 'No rules matched any file. Nothing to change.',
			});
			this.addCloseButton();
			return;
		}

		contentEl.createEl('p', {
			text: `Planned ${actionable.length} change(s) across ${new Set(
				this.changes.map((c) => c.filePath),
			).size} file(s). Review before applying.`,
			cls: 'structural-metadata-dryrun-summary',
		});

		const tableWrap = contentEl.createDiv({ cls: 'structural-metadata-table-wrap' });
		const table = tableWrap.createEl('table', {
			cls: 'structural-metadata-dryrun-table',
		});

		const thead = table.createEl('thead');
		const headRow = thead.createEl('tr');
		for (const header of [
			'File',
			'Property',
			'Old',
			'New',
			'Rule',
			'Action',
			'Conflict',
			'Reason',
		]) {
			headRow.createEl('th', { text: header });
		}

		const tbody = table.createEl('tbody');
		for (const change of this.changes) {
			const row = tbody.createEl('tr');
			row.createEl('td', { text: change.filePath });
			row.createEl('td', { text: change.property });
			row.createEl('td', { text: renderValue(change.oldValue) });
			row.createEl('td', { text: renderValue(change.newValue) });
			row.createEl('td', { text: change.ruleName });
			row.createEl('td', {
				text: change.action,
				cls: `structural-metadata-action-${change.action}`,
			});
			row.createEl('td', { text: change.conflict });
			row.createEl('td', { text: change.reason });
		}

		if (actionable.length > 0) {
			const btnRow = contentEl.createDiv({ cls: 'structural-metadata-actions' });
			new Setting(btnRow).addButton((btn: ButtonComponent) =>
				btn
					.setButtonText('Apply changes')
					.setCta()
					.onClick(async () => {
						btn.setButtonText('Applying…');
						btn.setDisabled(true);
						try {
							await this.onApply();
							this.close();
						} catch (err) {
							console.error('[Structural Metadata] Apply failed:', err);
							btn.setButtonText('Apply changes');
							btn.setDisabled(false);
						}
					}),
			);
		}

		this.addCloseButton();
	}

	private addCloseButton(): void {
		new Setting(this.contentEl).addButton((btn) =>
			btn.setButtonText('Close').onClick(() => this.close()),
		);
	}

	onClose(): void {
		this.contentEl.empty();
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
