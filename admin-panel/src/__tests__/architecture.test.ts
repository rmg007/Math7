import { describe, it, expect, beforeAll } from 'vitest';
import { projectFiles } from 'archunit';
import { extendVitestMatchers } from 'archunit/dist/src/testing/vitest/vitest-adapter';

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
    
    it('curriculum feature should not import from mentorship', async () => {
      const rule = projectFiles()
        .inFolder('src/features/curriculum/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('src/features/mentorship/**');
      
      await expect(rule).toPassAsync();
    });

    it('curriculum feature should not import from auth', async () => {
      const rule = projectFiles()
        .inFolder('src/features/curriculum/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('src/features/auth/**');
      
      await expect(rule).toPassAsync();
    });

    it('mentorship feature should not import from curriculum', async () => {
      const rule = projectFiles()
        .inFolder('src/features/mentorship/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('src/features/curriculum/**');
      
      await expect(rule).toPassAsync();
    });

    it('platform feature should not import from curriculum', async () => {
      const rule = projectFiles()
        .inFolder('src/features/platform/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('src/features/curriculum/**');
      
      await expect(rule).toPassAsync();
    });

    it('ai-assistant should be isolated from other features', async () => {
      const rule = projectFiles()
        .inFolder('src/features/ai-assistant/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('src/features/mentorship/**');
      
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
      const rule = projectFiles()
        .inFolder('src/components/**')
        .should()
        .haveNoCycles();
      
      await expect(rule).toPassAsync();
    });

    it('lib utilities should be free of cycles', async () => {
      const rule = projectFiles()
        .inFolder('src/lib/**')
        .should()
        .haveNoCycles();
      
      await expect(rule).toPassAsync();
    });

    it('hooks should be free of cycles', async () => {
      const rule = projectFiles()
        .inFolder('src/hooks/**')
        .should()
        .haveNoCycles();
      
      await expect(rule).toPassAsync();
    });
  });

  // Note: Code Metrics tests commented out due to archunit library bug
  // with guessLocationOfTsconfig. Can be re-enabled when library is fixed.
  // See: https://github.com/LukasNiessen/ArchUnitTS/issues
});
