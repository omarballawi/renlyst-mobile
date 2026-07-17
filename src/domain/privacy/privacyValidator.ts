const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu;
const iraqiMobilePattern = /(?<!\d)(?:\+?964|0)?7\d{9}(?!\d)/u;

export function containsObviousIdentifier(text: string): boolean {
  return emailPattern.test(text) || iraqiMobilePattern.test(text);
}
