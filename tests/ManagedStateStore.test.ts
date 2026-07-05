import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ManagedStateStore } from '../src/state/ManagedStateStore';
import { hashValue } from '../src/utils/hash';

describe('ManagedStateStore', () => {
	it('records and retrieves entries', () => {
		const store = new ManagedStateStore();
		store.recordWrite('a.md', 'project', 'r1', hashValue('Captzy'));
		const entry = store.getEntry('a.md', 'project');
		assert.ok(entry);
		assert.equal(entry?.ruleId, 'r1');
		assert.equal(entry?.valueHash, hashValue('Captzy'));
	});

	it('clears entries', () => {
		const store = new ManagedStateStore();
		store.recordWrite('a.md', 'project', 'r1', hashValue('x'));
		store.recordClear('a.md', 'project');
		assert.equal(store.getEntry('a.md', 'project'), null);
		assert.equal(store.size, 0);
	});

	it('migrates a single path on rename', () => {
		const store = new ManagedStateStore();
		store.recordWrite('old.md', 'project', 'r1', hashValue('x'));
		store.migratePath('old.md', 'new.md');
		assert.equal(store.getEntry('old.md', 'project'), null);
		assert.ok(store.getEntry('new.md', 'project'));
	});

	it('migrates a prefix on folder rename', () => {
		const store = new ManagedStateStore();
		store.recordWrite('old/sub/a.md', 'project', 'r1', hashValue('x'));
		store.recordWrite('old/sub/b.md', 'project', 'r1', hashValue('y'));
		const migrated = store.migratePrefix('old', 'new');
		assert.equal(migrated, 2);
		assert.ok(store.getEntry('new/sub/a.md', 'project'));
		assert.ok(store.getEntry('new/sub/b.md', 'project'));
		assert.equal(store.getEntry('old/sub/a.md', 'project'), null);
	});

	it('prunes non-existent paths', () => {
		const store = new ManagedStateStore();
		store.recordWrite('a.md', 'project', 'r1', hashValue('x'));
		store.recordWrite('b.md', 'project', 'r1', hashValue('y'));
		const removed = store.prune(new Set(['a.md']));
		assert.equal(removed, 1);
		assert.ok(store.getEntry('a.md', 'project'));
		assert.equal(store.getEntry('b.md', 'project'), null);
	});

	it('removes entries for a deleted rule', () => {
		const store = new ManagedStateStore();
		store.recordWrite('a.md', 'project', 'r1', hashValue('x'));
		store.recordWrite('a.md', 'link', 'r2', hashValue('y'));
		const removed = store.removeRule('r1');
		assert.equal(removed, 1);
		assert.equal(store.getEntry('a.md', 'project'), null);
		assert.ok(store.getEntry('a.md', 'link'));
	});

	it('serializes to a plain state object', () => {
		const store = new ManagedStateStore();
		store.recordWrite('a.md', 'project', 'r1', hashValue('x'));
		const state = store.state;
		assert.ok(state.entries['a.md']?.project);
		// Reconstructing yields the same entries.
		const store2 = new ManagedStateStore(state);
		assert.ok(store2.getEntry('a.md', 'project'));
	});
});
