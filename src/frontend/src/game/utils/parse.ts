export function checkDuplicateInString(str: string) {
  // Source - https://stackoverflow.com/a
  // Posted by Fawad Mueed
  // Retrieved 2025-12-30, License - CC BY-SA 3.0
  if (str) {
    try {
      return str
        .toLowerCase()
        .split('')
        .sort()
        .join('')
        .match(/(.)\1+/g)?.length;
    } catch (e: unknown) {
      const _error = e;
      return 0;
    }
  }
}
