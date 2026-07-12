import { App, Modal, Notice, Setting } from 'obsidian';
import type { StructuralRule } from '../../domain/rules';
import { validateRule } from '../../settings';
import { cloneRule } from '../ruleOptions';
import { renderFormatFields } from './formatFields';
import { renderGeneralFields } from './generalFields';
import { renderResolverFields } from './resolverFields';
import { renderScopeFields } from './scopeFields';

export class RuleEditorModal extends Modal {
	private rule: StructuralRule;

	constructor(
		app: App,
		rule: StructuralRule,
		private onSave: (rule: StructuralRule) => void,
	) {
		super(app);
		this.rule = cloneRule(rule);
		this.setTitle('Edit rule');
	}

	onOpen(): void {
		this.contentEl.empty();
		renderGeneralFields(this.contentEl, this.rule);
		renderScopeFields(this.contentEl, this.rule);
		renderResolverFields(this.contentEl, this.rule);
		renderFormatFields(this.contentEl, this.rule);
		new Setting(this.contentEl)
			.addButton((button) =>
				button.setButtonText('Save').setCta().onClick(() => this.save()),
			)
			.addButton((button) =>
				button.setButtonText('Cancel').onClick(() => this.close()),
			);
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private save(): void {
		const errors = validateRule(this.rule);
		if (errors.length > 0) {
			new Notice(`Structural properties: ${errors.join(' ')}`, 5000);
			return;
		}
		this.onSave(this.rule);
		this.close();
	}
}
