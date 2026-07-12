import type { StructuralRule } from '../../domain/rules';
import { generateRuleId } from '../../settings';

export function createEmptyRule(): StructuralRule {
	return {
		id: generateRuleId(),
		name: 'New rule',
		enabled: true,
		priority: 50,
		property: '',
		scope: { include: ['**/*.md'], exclude: [], markdownOnly: true },
		resolver: {
			type: 'parent-folder-note',
			folderNoteSelfBehavior: 'parent-folder-note',
		},
		format: { type: 'wikilink', style: 'full-path' },
	};
}
