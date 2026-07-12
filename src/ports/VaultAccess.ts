export interface FileRef {
	path: string;
	basename: string;
	extension: string;
}

export interface FolderRef {
	path: string;
	name: string;
}

export interface VaultAccess {
	getFileByPath(path: string): FileRef | null;
	getFolderByPath(path: string): FolderRef | null;
	fileExists(path: string): boolean;
	readFrontmatter(path: string): Promise<Record<string, unknown> | null>;
	getAllMarkdownFilePaths(): string[];
}
