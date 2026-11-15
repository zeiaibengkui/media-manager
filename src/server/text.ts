export function sanitizeText(value: string): string {
  return [...value]
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0;
      const whitespace = code === 9 || code === 10 || code === 13;
      const control = code < 32 || code === 127;
      const surrogate = code >= 0xd800 && code <= 0xdfff;
      return !surrogate && (!control || whitespace);
    })
    .join("");
}
