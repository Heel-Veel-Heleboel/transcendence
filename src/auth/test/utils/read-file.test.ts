import {  describe, it, expect, vi } from 'vitest';
import { readFile } from '../../../src/auth/src/utils/read-file.ts';

vi.mock('fs', () => {
  return {
    readFileSync: vi.fn((filePath: string) => {
      if (filePath === './keys/valid.pem') {
        return 'valid-key-content';
      } else if (filePath === './keys/empty.pem') {
        return '   ';
      } else {
        throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
      }
    })
  };
});

describe('readFile utility function', () => {
  it('Reads file content successfully', () => {
    const content = readFile('./keys/valid.pem');
    expect(content).toBe('valid-key-content');
  });

  it('Throws an error if file does not exist', () => {
    expect(() => readFile('./keys/nonexistent.pem')).toThrow('Error reading file at ./keys/nonexistent.pem: ENOENT: no such file or directory, open \'./keys/nonexistent.pem\'');
  });

  it('Throws an error if file is empty', () => {
    expect(() => readFile('./keys/empty.pem')).toThrow('Error reading file at ./keys/empty.pem: File at ./keys/empty.pem is empty');
  });
});

