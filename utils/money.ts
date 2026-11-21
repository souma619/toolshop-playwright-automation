// Turns "$1,327.59" into 1327.59 so totals can be compared as numbers.
export function parseMoney(text: string): number {
  const value = Number(text.replace(/[^0-9.-]/g, ''));
  if (Number.isNaN(value)) {
    throw new Error(`Could not parse a price from "${text}"`);
  }
  return value;
}
