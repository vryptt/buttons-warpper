export function safeJSONParse<T = any>(
  str: string,
  errors: string[],
  warnings: string[],
  index: number,
  name: string
): T | null {
  try {
    return JSON.parse(str) as T;
  } catch (e) {
    const error = e as Error;
    errors.push(`button[${index}] (${name}) invalid JSON: ${error.message}`);
    return null;
  }
}

export function safeJSONStringify(value: any): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}