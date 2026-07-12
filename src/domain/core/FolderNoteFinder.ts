import type { VaultAccess } from '../../ports/VaultAccess';
import { getBaseName } from '../../utils/path';

/**
 * Expand a folder-note pattern template for a given folder path.
 *
 * Supported placeholders:
 *   {{folderPath}}  - the folder's vault path, e.g. "01 Projects/Captzy"
 *   {{folderName}}  - the folder's name, e.g. "Captzy"
 */
export function expandFolderNotePattern(
	pattern: string,
	folderPath: string,
): string {
	const folderName = getBaseName(folderPath);
	return pattern
		.replaceAll('{{folderPath}}', folderPath)
		.replaceAll('{{folderName}}', folderName);
}

/**
 * Find the first existing folder note for `folderPath` using the configured
 * patterns. Returns the vault path of the note, or null when none exists.
 *
 * The root folder ("") has no folder note.
 */
export function findFolderNote(
	folderPath: string,
	patterns: string[],
	vault: VaultAccess,
): string | null {
	if (!folderPath) return null;
	for (const pattern of patterns) {
		const candidate = expandFolderNotePattern(pattern, folderPath);
		if (candidate && vault.fileExists(candidate)) {
			return candidate;
		}
	}
	return null;
}
