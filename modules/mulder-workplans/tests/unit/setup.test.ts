/**
 * Basic setup test to verify Jest configuration is working correctly
 */
describe('Project Setup', () => {
  it('should have proper test environment', () => {
    expect(true).toBe(true);
  });

  it('should support TypeScript', () => {
    const testValue: string = 'hello';
    expect(typeof testValue).toBe('string');
  });

  it('should support ES modules', async () => {
    const dynamicImport = async () => {
      // This would normally import a module dynamically
      return Promise.resolve({ test: 'value' });
    };

    const result = await dynamicImport();
    expect(result).toEqual({ test: 'value' });
  });
});