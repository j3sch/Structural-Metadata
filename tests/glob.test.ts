import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { matchGlob } from '../src/utils/glob';

describe('glob matcher', () => {
	it('matches double-star under a folder', () => {
		assert.equal(matchGlob('01 Projects/Captzy/note.md', '01 Projects/**'), true);
		assert.equal(matchGlob('01 Projects/note.md', '01 Projects/**'), true);
		assert.equal(matchGlob('01 Projects/Captzy/sub/note.md', '01 Projects/**'), true);
	});

	it('does not match other top-level folders', () => {
		assert.equal(matchGlob('Inbox/note.md', '01 Projects/**'), false);
	});

	it('matches **/*.md anywhere', () => {
		assert.equal(matchGlob('note.md', '**/*.md'), true);
		assert.equal(matchGlob('a/b/c/note.md', '**/*.md'), true);
		assert.equal(matchGlob('a/b/note.txt', '**/*.md'), false);
	});

	it('matches specific extensions like excalidraw', () => {
		assert.equal(matchGlob('a/b/note.excalidraw.md', '**/*.excalidraw.md'), true);
		assert.equal(matchGlob('a/b/note.md', '**/*.excalidraw.md'), false);
	});

	it('matches folder-prefixed globs', () => {
		assert.equal(matchGlob('templater/foo.md', 'templater/**'), true);
		assert.equal(matchGlob('templates/x/y.md', 'templates/**'), true);
		assert.equal(matchGlob('other/x.md', 'templater/**'), false);
	});

	it('treats single star as not crossing slashes', () => {
		assert.equal(matchGlob('note.md', '*.md'), true);
		assert.equal(matchGlob('a/note.md', '*.md'), false);
	});

	it('supports mid-path double-star', () => {
		assert.equal(matchGlob('a/b/c.md', 'a/**/c.md'), true);
		assert.equal(matchGlob('a/c.md', 'a/**/c.md'), true);
	});
});
