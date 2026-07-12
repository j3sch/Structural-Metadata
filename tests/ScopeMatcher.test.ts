import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ScopeMatcher } from '../src/domain/core/ScopeMatcher';
import { defaultSettings } from '../src/settings';

const defaults = defaultSettings().excludePatterns;

describe('ScopeMatcher', () => {
	it('respects markdownOnly', () => {
		const scope = { include: ['**/*'], exclude: [], markdownOnly: true };
		assert.equal(ScopeMatcher.matches('a/b.md', scope, []), true);
		assert.equal(ScopeMatcher.matches('a/b.txt', scope, []), false);
	});

	it('applies include globs', () => {
		const scope = { include: ['01 Projects/**'], exclude: [], markdownOnly: true };
		assert.equal(ScopeMatcher.matches('01 Projects/Captzy/n.md', scope, []), true);
		assert.equal(ScopeMatcher.matches('Inbox/n.md', scope, []), false);
	});

	it('applies exclude globs before includes', () => {
		const scope = { include: ['**/*.md'], exclude: ['templater/**'], markdownOnly: true };
		assert.equal(ScopeMatcher.matches('templater/x.md', scope, []), false);
		assert.equal(ScopeMatcher.matches('notes/x.md', scope, []), true);
	});

	it('applies default excludes (excalidraw)', () => {
		const scope = { include: ['**/*.md'], exclude: [], markdownOnly: true };
		assert.equal(
			ScopeMatcher.matches('a/b/drawing.excalidraw.md', scope, defaults),
			false,
		);
		assert.equal(ScopeMatcher.matches('a/b/note.md', scope, defaults), true);
	});

	it('enforces minDepthBelowRoot', () => {
		const scope = { include: ['**/*.md'], exclude: [], minDepthBelowRoot: 1, markdownOnly: true };
		assert.equal(ScopeMatcher.matches('note.md', scope, []), false);
		assert.equal(ScopeMatcher.matches('a/note.md', scope, []), true);
		assert.equal(ScopeMatcher.matches('a/b/note.md', scope, []), true);
	});

	it('empty include matches everything passing filters', () => {
		const scope = { include: [], exclude: [], markdownOnly: true };
		assert.equal(ScopeMatcher.matches('any/where/note.md', scope, []), true);
	});
});
