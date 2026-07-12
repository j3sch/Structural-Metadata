import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { expandFolderNotePattern, findFolderNote } from '../src/domain/core/FolderNoteFinder';
import { MockVault } from './mocks';

const patterns = [
	'{{folderPath}}/{{folderName}}.md',
	'{{folderPath}}/index.md',
	'{{folderPath}}.md',
];

describe('FolderNoteFinder', () => {
	it('expands same-name pattern', () => {
		assert.equal(
			expandFolderNotePattern('{{folderPath}}/{{folderName}}.md', '01 Projects/Captzy'),
			'01 Projects/Captzy/Captzy.md',
		);
	});

	it('expands index pattern', () => {
		assert.equal(
			expandFolderNotePattern('{{folderPath}}/index.md', '01 Projects/Captzy'),
			'01 Projects/Captzy/index.md',
		);
	});

	it('expands outside-folder pattern', () => {
		assert.equal(
			expandFolderNotePattern('{{folderPath}}.md', '01 Projects/Captzy'),
			'01 Projects/Captzy.md',
		);
	});

	it('finds a same-name folder note', () => {
		const vault = new MockVault({ files: ['01 Projects/Captzy/Captzy.md'] });
		assert.equal(
			findFolderNote('01 Projects/Captzy', patterns, vault),
			'01 Projects/Captzy/Captzy.md',
		);
	});

	it('falls back to index.md', () => {
		const vault = new MockVault({ files: ['01 Projects/Captzy/index.md'] });
		assert.equal(
			findFolderNote('01 Projects/Captzy', patterns, vault),
			'01 Projects/Captzy/index.md',
		);
	});

	it('returns null when no folder note exists', () => {
		const vault = new MockVault({ files: ['01 Projects/Captzy/note.md'] });
		assert.equal(findFolderNote('01 Projects/Captzy', patterns, vault), null);
	});

	it('returns null for the root folder', () => {
		const vault = new MockVault({ files: ['index.md'] });
		assert.equal(findFolderNote('', patterns, vault), null);
	});
});
