import * as fs from 'fs';
import * as path from 'path';

function collectTsFiles(dirPath: string): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(absolutePath));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.ts')) continue;
    files.push(absolutePath);
  }

  return files;
}

describe('Repository sweep (backend)', () => {
  const srcRoot = path.resolve(__dirname);
  const files = collectTsFiles(srcRoot)
    .filter((filePath) => !filePath.endsWith('.spec.ts'))
    .filter((filePath) => !filePath.endsWith(path.join('src', 'main.ts')))
    .sort();

  it('should have files to validate', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('loads %s without module-level crash', (filePath) => {
    expect(() => {
      require(filePath);
    }).not.toThrow();
  });
});
