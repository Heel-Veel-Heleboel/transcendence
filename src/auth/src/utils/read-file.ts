import { readFileSync } from 'fs';

export function readFile(filePath: string): string {
  try {
    const content = readFileSync(filePath, 'utf-8').trim();
    if (!content) {
      throw new Error(`File at ${filePath} is empty`);
    }
    return content;
  } catch (err) {
    throw new Error(`Error reading file at ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
  }
}