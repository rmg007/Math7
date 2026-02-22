import { projectFiles } from 'archunit';
import { extendVitestMatchers } from 'archunit/dist/src/testing/vitest/vitest-adapter';
import { beforeAll, describe, expect, it } from 'vitest';

// Extend Vitest with ArchUnit matchers
beforeAll(() => {
  extendVitestMatchers();
});

/**
 * Architecture Tests for Admin Panel
 *
 * These tests enforce architectural boundaries to prevent coupling violations
 * and maintain clean code organization.
 */
describe('Architecture Rules', () => {
  describe('Layer Dependencies', () => {
    it('services should not depend on components (UI layer)', async () => {
      const rule = projectFiles()
        .inFolder('src/services/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('src/components/**');

      await expect(rule).toPassAsync();
    });

    it('lib utilities should not depend on features', async () => {
      const rule = projectFiles()
        .inFolder('src/lib/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('src/features/**');

      await expect(rule).toPassAsync();
    });

    it('types should not depend on runtime code', async () => {
      const rule = projectFiles()
        .inFolder('src/types/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('src/services/**');

      await expect(rule).toPassAsync();
    });
  });

  describe('Feature Isolation', () => {
    const features = [
      'ai-assistant',
      'ai-content',
      'auth',
      'curriculum',
      'dashboard',
      'mentorship',
      'monitoring',
      'platform',
    ];

    it.each(
      features.flatMap((f1) =>
        features
          .filter((f2) => {
            if (f1 === f2) return false;
            // Exception: AI features are designed to work with curriculum
            if ((f1 === 'ai-assistant' || f1 === 'ai-content') && f2 === 'curriculum') {
              return false;
            }
            return true;
          })
          .map((f2) => [f1, f2])
      )
    )('%s should not import from %s', async (f1, f2) => {
      const rule = projectFiles()
        .inFolder(`src/features/${f1}/**`)
        .shouldNot()
        .dependOnFiles()
        .inFolder(`src/features/${f2}/**`);

      await expect(rule).toPassAsync();
    });
  });

  describe('Naming Conventions', () => {
    it('hooks should follow use-*.ts naming pattern', async () => {
      const rule = projectFiles()
        .inFolder('src/hooks/**')
        .should()
        .haveName(/^use-.*\.(ts|tsx)$/);

      await expect(rule).toPassAsync();
    });

    it('feature hooks should follow use-*.ts naming pattern', async () => {
      const rule = projectFiles()
        .inFolder('src/features/**/hooks/**')
        .should()
        .haveName(/^use-.*\.(ts|tsx)$/);

      await expect(rule).toPassAsync();
    });
  });

  describe('Circular Dependencies', () => {
    it('components should be free of cycles', async () => {
      const rule = projectFiles().inFolder('src/components/**').should().haveNoCycles();

      await expect(rule).toPassAsync();
    });

    it('lib utilities should be free of cycles', async () => {
      const rule = projectFiles().inFolder('src/lib/**').should().haveNoCycles();

      await expect(rule).toPassAsync();
    });

    it('hooks should be free of cycles', async () => {
      const rule = projectFiles().inFolder('src/hooks/**').should().haveNoCycles();

      await expect(rule).toPassAsync();
    });
  });

  // Note: Code Metrics tests commented out due to archunit library bug
  // with guessLocationOfTsconfig. Can be re-enabled when library is fixed.
  // See: https://github.com/LukasNiessen/ArchUnitTS/issues
});
