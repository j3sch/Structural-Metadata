export interface ManagedEntry {
	ruleId: string;
	property: string;
	valueHash: string;
}

export interface ManagedFileEntry {
	[property: string]: ManagedEntry;
}

export interface ManagedState {
	entries: Record<string, ManagedFileEntry>;
}

export interface ManagedStateReader {
	getEntry(filePath: string, property: string): ManagedEntry | null;
	getPropertiesForFile(filePath: string): string[];
}

export interface ManagedStateWriter {
	recordWrite(
		filePath: string,
		property: string,
		ruleId: string,
		valueHash: string,
	): void;
	recordClear(filePath: string, property: string): void;
}
