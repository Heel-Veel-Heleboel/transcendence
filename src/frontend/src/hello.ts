const world = 'world';

export function hello(who: string = world): string {
  console.log('is this working?');
  return `Hello ${who}!`;
}

hello('world');
