
export function parseIntSave(value: string | undefined, defaultValue : number) : number {
  
  if (!value) {
    return (defaultValue);
  }
  const trimed = value.trim();
  if (/[^\d]/.test(trimed)) {
    return (NaN);
  }
  return (parseInt(trimed, 10));
} 