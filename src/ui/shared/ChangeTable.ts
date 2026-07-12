import type { PlannedChange } from '../../domain/changes';
import { renderValue } from './renderValue';

export function renderChangeTable(container: HTMLElement, changes: PlannedChange[]): void {
	container.empty();
	if (changes.length === 0) {
		container.createEl('p', { text: 'No rules matched this path.' });
		return;
	}
	const table = container.createEl('table', {
		cls: 'structural-properties-dryrun-table',
	});
	const header = table.createEl('thead').createEl('tr');
	for (const label of ['Property', 'Old', 'New', 'Action', 'Conflict', 'Reason']) {
		header.createEl('th', { text: label });
	}
	const body = table.createEl('tbody');
	for (const change of changes) {
		const row = body.createEl('tr');
		row.createEl('td', { text: change.property });
		row.createEl('td', { text: renderValue(change.oldValue) });
		row.createEl('td', { text: renderValue(change.newValue) });
		row.createEl('td', { text: change.action });
		row.createEl('td', { text: change.conflict });
		row.createEl('td', { text: change.reason });
	}
}
