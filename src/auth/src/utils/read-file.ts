import fs from 'fs';

export function readFile(filePath: string) : string {
  try{
    return fs.readFileSync(filePath, 'utf-8');
  } catch(err) {
    throw new Error(`Error reading file at ${filePath}: ${err}`);
  }
}