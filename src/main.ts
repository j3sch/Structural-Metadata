import { Plugin } from 'obsidian';
import {
	EventController,
	type EventControllerHost,
} from './adapters/obsidian/EventController';
import { ObsidianFrontmatterRepository } from './adapters/obsidian/ObsidianFrontmatterRepository';
import { ObsidianLinkGenerator } from './adapters/obsidian/ObsidianLinkGenerator';
import { ObsidianPluginDataStore } from './adapters/obsidian/ObsidianPluginDataStore';
import { ObsidianVaultAccess } from './adapters/obsidian/ObsidianVaultAccess';
import { createPluginServices, type PluginServices } from './application/PluginServices';
import { SettingsController } from './application/SettingsController';
import { CommandHandlers } from './commands/CommandHandlers';
import { registerCommands } from './commands';
import type { StructuralMetadataSettings } from './domain/rules';
import type { PluginDataStore } from './ports/PluginDataStore';
import { ManagedStateStore } from './domain/ManagedStateStore';
import { StructuralMetadataSettingsTab } from './ui/settings/SettingsTab';

export default class StructuralMetadataPlugin extends Plugin {
	settings!: StructuralMetadataSettings;
	private managedState!: ManagedStateStore;
	private dataStore!: PluginDataStore;
	private services!: PluginServices;
	private eventController!: EventController;

	async onload(): Promise<void> {
		this.dataStore = new ObsidianPluginDataStore(this);
		this.settings = await this.dataStore.load();
		this.managedState = new ManagedStateStore(this.settings.managedState);
		await this.dataStore.save(this.settings);

		const vault = new ObsidianVaultAccess(this.app);
		const persist = (): Promise<void> => this.persist();
		this.services = createPluginServices({
			frontmatter: new ObsidianFrontmatterRepository(this.app),
			vault,
			linkGenerator: new ObsidianLinkGenerator(this.app),
			getSettings: () => this.settings,
			managedState: this.managedState,
			persist,
		});

		const commands = new CommandHandlers(this.app, this.services, persist);
		registerCommands(this, commands);
		this.addSettingTab(
			new StructuralMetadataSettingsTab(
				this.app,
				this,
				new SettingsController(() => this.settings, this.services, persist),
			),
		);

		this.eventController = new EventController(this, this.eventHost(commands));
		this.eventController.start();
		this.app.workspace.onLayoutReady(() => {
			void this.services.maintenance.pruneManagedState();
		});
	}

	onunload(): void {
		this.eventController?.stop();
	}

	private eventHost(commands: CommandHandlers): EventControllerHost {
		return {
			managedState: this.managedState,
			getDebounceMs: () => this.settings.debounceMs,
			processPaths: (paths) => commands.processPaths(paths),
		};
	}

	private async persist(): Promise<void> {
		this.settings.managedState = this.managedState.state;
		await this.dataStore.save(this.settings);
	}
}
