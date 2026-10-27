/**
 * Independent arithmetic from the STORY givens only. This deliberately has
 * no dependency on visual JSON, model equations, explanations or stored keys.
 * Narrowly recognises the six pilot story forms; an unrecognised story fails.
 * This is an automated cross-check, not a human/blind-review attestation.
 */
export function independentlySolvePilot(prompt: string): {answer: number; calculation: string} {
  const numbers = (prompt.match(/\d+/g) ?? []).map(Number);
  let answer: number;
  let calculation: string;
  const [a, b, total] = numbers;
  if (numbers.length === 2 && /times as many/.test(prompt)) {
    answer = b / (a + 1) * a;
    calculation = `${b} / (${a} + 1) * ${a}`;
  } else if (numbers.length === 3 && /same number.*each|same amount.*each|equal packs/.test(prompt)) {
    answer = total / (a + b) * Math.max(a, b);
    calculation = `${total} / (${a} + ${b}) * ${Math.max(a, b)}`;
  } else if (numbers.length === 2 && /gives.*some|gives.*so/.test(prompt) && /same/.test(prompt)) {
    answer = (a - b) / 2;
    calculation = `(${a} - ${b}) / 2`;
  } else if (numbers.length === 2 && /rest|How many (?:more|fewer)/.test(prompt)) {
    answer = a - b;
    calculation = `${a} - ${b}`;
  } else if (numbers.length === 2 && /left|remain/.test(prompt) && /start|begin/.test(prompt)) {
    answer = a + b;
    calculation = `${a} + ${b}`;
  } else {
    throw new Error(`Unrecognised pilot story: ${prompt}`);
  }
  if (!Number.isSafeInteger(answer) || answer < 0) throw new Error(`Invalid independent result: ${prompt}`);
  return {answer, calculation: `${calculation} = ${answer}`};
}
