import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	getBaseName,
	getExtension,
	getFileName,
	getFolderName,
	getParentFolderPath,
	getPathSegments,
	joinPath,
	normalizeSlashes,
} from '../src/utils/path';

describe('path utils', () => {
	it('normalizes slashes', () => {
		assert.equal(normalizeSlashes('a\\b\\c'), 'a/b/c');
	});

	it('gets parent folder path', () => {
		assert.equal(getParentFolderPath('a/b/c.md'), 'a/b');
		assert.equal(getParentFolderPath('c.md'), '');
	});

	it('gets base name', () => {
		assert.equal(getBaseName('a/b/c.md'), 'c.md');
		assert.equal(getBaseName('c.md'), 'c.md');
	});

	it('gets file name without extension', () => {
		assert.equal(getFileName('a/b/c.md'), 'c');
		assert.equal(getFileName('a/b/.hidden'), '.hidden');
	});

	it('gets extension', () => {
		assert.equal(getExtension('a/b/c.md'), 'md');
		assert.equal(getExtension('a/b/c'), '');
	});

	it('gets containing folder name', () => {
		assert.equal(getFolderName('01 Projects/Captzy/note.md'), 'Captzy');
		assert.equal(getFolderName('note.md'), '');
	});

	it('splits into segments', () => {
		assert.deepEqual(getPathSegments('a/b/c.md'), ['a', 'b', 'c.md']);
		assert.deepEqual(getPathSegments('/a//b/'), ['a', 'b']);
	});

	it('joins paths', () => {
		assert.equal(joinPath('a', 'b', 'c.md'), 'a/b/c.md');
		assert.equal(joinPath('a/', '/b'), 'a/b');
	});
});
