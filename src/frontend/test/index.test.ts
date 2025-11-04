import { expect, test } from 'vitest';
import { hello } from '../src/index.ts';

test('return hello world', () => {
  expect(hello('world')).toBe('Hello world!');
});
