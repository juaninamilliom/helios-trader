/**
 * @function ensureError
 * @description Safely converts an unknown value into an Error object.
 * @param {unknown} value - The value of unknown type.
 * @returns {Error} The converted Error object.
 */
export function ensureError(value: unknown): Error {
  if (value instanceof Error) return value;

  let stringified = '[Unable to stringify the thrown value]';
  try {
    stringified = JSON.stringify(value);
  } catch {
    // ignored
  }

  const error = new Error(
    `This value was thrown as is, not as an Error: ${stringified}`,
  );
  return error;
}
