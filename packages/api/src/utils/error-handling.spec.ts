import { ensureError } from './error-handling';

describe('ensureError', () => {
  it('should return the same error if the value is already an error', () => {
    const error = new Error('Test error');
    expect(ensureError(error)).toBe(error);
  });

  it('should create a new error if the value is not an error', () => {
    const value = 'just a string';
    const error = ensureError(value);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain(
      'This value was thrown as is, not as an Error',
    );
    expect(error.message).toContain(JSON.stringify(value));
  });

  it('should handle non-stringifiable values', () => {
    const value = { a: 1, b: { c: 2 } };
    const circularValue = { ...value };
    circularValue.b.c = circularValue as any;

    const error = ensureError(circularValue);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain('[Unable to stringify the thrown value]');
  });
});
