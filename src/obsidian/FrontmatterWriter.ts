import { App, Notice, TFile } from 'obsidian';
import type {
  FrontmatterSnapshot,
  PlannedChange,
  ProcessorResult,
} from '../types';
import { hashValue } from '../utils/hash';
import type { ManagedStateStore } from '../state/ManagedStateStore';

/**
 * Writes planned frontmatter changes exclusively through
 * `app.fileManager.processFrontMatter`, which atomically reads, mutates and
 * saves frontmatter.
 *
 * Changes are grouped by file so each file is written in a single atomic call.
 */
export class FrontmatterWriter {
  constructor(private app: App) { }

  /** Apply a batch of planned changes and update managed state accordingly. */
  async applyPlannedChanges(
    changes: PlannedChange[],
    managedState: ManagedStateStore,
  ): Promise<ProcessorResult> {
    const byFile = groupByFile(changes);
    let applied = 0;
    let skipped = 0;
    let errors = 0;

    for (const [filePath, fileChanges] of byFile) {
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!(file instanceof TFile)) {
        errors += fileChanges.length;
        continue;
      }

      await this.ensureFrontmatterSkeleton(file);

      try {
        await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
          for (const change of fileChanges) {
            if (change.action === 'set') {
              fm[change.property] = change.newValue;
            } else if (change.action === 'clear') {
              delete fm[change.property];
            }
          }
        });

        for (const change of fileChanges) {
          if (change.action === 'set') {
            managedState.recordWrite(
              filePath,
              change.property,
              change.ruleId,
              hashValue(change.newValue),
            );
            applied++;
          } else if (change.action === 'clear') {
            managedState.recordClear(filePath, change.property);
            applied++;
          } else {
            skipped++;
          }
        }
      } catch (err) {
        errors += fileChanges.length;
        console.error(
          `[Structural Properties] Failed to update frontmatter for "${filePath}":`,
          err,
        );
        new Notice(
          `Structural properties: could not update "${filePath}" (see console)`,
          5000,
        );
      }
    }

    return { applied, skipped, errors };
  }

  /** Read the current frontmatter of a file (from the metadata cache). */
  async readFrontmatter(filePath: string): Promise<FrontmatterSnapshot> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) return {};
    const cache = this.app.metadataCache.getFileCache(file);
    return cache?.frontmatter ?? {};
  }

  /**
   * Ensure a truly empty file has a frontmatter block before
   * `processFrontMatter` runs, to avoid edge cases with empty notes.
   */
  private async ensureFrontmatterSkeleton(file: TFile): Promise<void> {
    const content = await this.app.vault.cachedRead(file);
    if (content.trim() === '') {
      await this.app.vault.process(file, () => '---\n---\n');
    }
  }
}

function groupByFile(
  changes: PlannedChange[],
): Map<string, PlannedChange[]> {
  const map = new Map<string, PlannedChange[]>();
  for (const change of changes) {
    const list = map.get(change.filePath);
    if (list) {
      list.push(change);
    } else {
      map.set(change.filePath, [change]);
    }
  }
  return map;
}
