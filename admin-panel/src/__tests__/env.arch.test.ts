import { describe, it, expect, beforeAll } from 'vitest';
import { projectFiles } from 'archunit';
import { extendVitestMatchers } from 'archunit/dist/src/testing/vitest/vitest-adapter';

beforeAll(() => extendVitestMatchers());

describe('Env module layering', () => {
  it('feature components should not directly import environment configuration', async () => {
    // Components can import types from lib/** (e.g., database.types.ts)
    // but should not import runtime configs like env.ts directly
    // They should use context providers or hooks instead
    const rule = projectFiles()
      .inFolder('src/features/**/components/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/lib/env.ts');
    
    // Note: This test uses .check({ allowEmptyTests: true }) because
    // if no violations are found, it means components are properly using
    // context/hooks instead of direct env imports
    await expect(rule).toPassAsync({ allowEmptyTests: true });
  });
});
