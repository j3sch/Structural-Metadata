import type { PlannedChange } from '../domain/changes';
import type {
	LinkStyle,
	OnNoMatch,
	StructuralMetadataSettings,
	StructuralRule,
	WritePolicy,
} from '../domain/rules';
import { validateDebounce } from '../settings';
import type { PluginServices } from './PluginServices';

export class SettingsController {
	constructor(
		private getCurrentSettings: () => StructuralMetadataSettings,
		private services: PluginServices,
		private persist: () => Promise<void>,
	) {}

	get settings(): StructuralMetadataSettings {
		return this.getCurrentSettings();
	}

	getControlValue(key: string): unknown {
		return this.settings[key as keyof StructuralMetadataSettings];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		switch (key) {
			case 'debounceMs':
				if (typeof value !== 'number' || validateDebounce(value)) return;
				this.settings.debounceMs = value;
				break;
			case 'writePolicy':
				this.settings.writePolicy = value as WritePolicy;
				break;
			case 'onNoMatch':
				this.settings.onNoMatch = value as OnNoMatch;
				break;
			case 'linkStyle':
				this.settings.linkStyle = value as LinkStyle;
				break;
			default:
				throw new Error(`Unsupported declarative setting key: ${key}`);
		}
		await this.persist();
	}

	async setExcludePatterns(patterns: string[]): Promise<void> {
		this.settings.excludePatterns = patterns;
		await this.persist();
	}

	async setFolderNotePatterns(patterns: string[]): Promise<void> {
		this.settings.folderNotePatterns = patterns;
		await this.persist();
	}

	addRule(rule: StructuralRule): Promise<void> {
		return this.services.rules.addRule(rule);
	}

	updateRule(rule: StructuralRule): Promise<void> {
		return this.services.rules.updateRule(rule);
	}

	setRuleEnabled(ruleId: string, enabled: boolean): Promise<void> {
		return this.services.rules.setEnabled(ruleId, enabled);
	}

	deleteRule(ruleId: string): Promise<void> {
		return this.services.rules.deleteRule(ruleId);
	}

	previewPath(path: string): Promise<PlannedChange[]> {
		return this.services.processing.planPaths([path]);
	}

	cleanManagedState(): Promise<number> {
		return this.services.maintenance.pruneManagedState();
	}
}
