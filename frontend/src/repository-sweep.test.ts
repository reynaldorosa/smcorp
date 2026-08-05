import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function collectFiles(baseDir: string): string[] {
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(baseDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(absolutePath));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    files.push(absolutePath);
  }

  return files;
}

describe('Repository sweep (frontend)', () => {
  const srcRoot = path.resolve(__dirname);
  const sweepRoots = ['components', 'services', 'stores', 'lib']
    .map((segment) => path.join(srcRoot, segment))
    .filter((segmentPath) => fs.existsSync(segmentPath));

  const files = sweepRoots
    .flatMap((segmentPath) => collectFiles(segmentPath))
    .filter((filePath) => !/\.(test|spec)\.(ts|tsx)$/.test(filePath))
    .filter((filePath) => !filePath.endsWith(path.join('lib', 'api.ts')))
    .sort();

  it('should have files to validate', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('loads %s without module-level crash', async (filePath) => {
    await expect(import(filePath)).resolves.toBeDefined();
  });
});
