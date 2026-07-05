import type StructuralMetadataPlugin from '../main';

/**
 * Register all plugin commands so they appear in the command palette.
 *
 * Implementations delegate to the plugin, which orchestrates the processor,
 * managed state and UI modals.
 */
export function registerCommands(plugin: StructuralMetadataPlugin): void {
	plugin.addCommand({
		id: 'refresh-current-file',
		name: 'Refresh current file',
		editorCallback: () => plugin.refreshCurrentFile(),
	});

	plugin.addCommand({
		id: 'refresh-current-folder',
		name: 'Refresh current folder',
		editorCallback: () => plugin.refreshCurrentFolder(),
	});

	plugin.addCommand({
		id: 'refresh-entire-vault',
		name: 'Refresh entire vault',
		callback: () => plugin.refreshEntireVault(),
	});

	plugin.addCommand({
		id: 'dry-run-current-folder',
		name: 'Dry run current folder',
		editorCallback: () => plugin.dryRunCurrentFolder(),
	});

	plugin.addCommand({
		id: 'dry-run-entire-vault',
		name: 'Dry run entire vault',
		callback: () => plugin.dryRunEntireVault(),
	});

	plugin.addCommand({
		id: 'clean-managed-state',
		name: 'Clean managed state',
		callback: () => plugin.cleanManagedState(),
	});
}
