import { readdirSync } from 'node:fs';
import path from 'node:path';

function getFiles(parent: string): string[] {
  const dirents = readdirSync(parent, { withFileTypes: true });
  return dirents
    .filter((dirent) => dirent.isFile() && !dirent.name.startsWith('.'))
    .map((dirent) => path.join(parent, dirent.name));
}

interface GetFilePathsOptions {
  fileExtension?: string;
}

export function getFilePaths(relativePath: string, rootDir: string, options: GetFilePathsOptions = {}): string[] {
  const files = getFiles(path.resolve(rootDir, relativePath));
  const filteredFiles = options.fileExtension
    ? files.filter((file) => file.toLowerCase().endsWith(options.fileExtension!))
    : files;
  return filteredFiles.map((file) => path.join('/', path.relative(rootDir, file)));
}
