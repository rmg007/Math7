/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    /* === CIRCULAR DEPENDENCIES === */
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'Circular dependencies can lead to hard-to-debug issues and infinite loops',
      from: {},
      to: {
        circular: true,
      },
    },

    /* === ORPHAN MODULES === */
    {
      name: 'no-orphans',
      severity: 'warn',
      comment:
        'Orphan modules are files that are not imported anywhere. They might be dead code.',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$', // config files
          '\\.d\\.ts$', // TypeScript declaration files
          '(^|/)tsconfig\\.json$',
          '(^|/)vite\\.config\\.',
          '(^|/)vitest\\.config\\.',
          '(^|/)main\\.tsx?$', // entry points
          '(^|/)App\\.tsx?$',
          '\\.test\\.(ts|tsx)$', // test files
          '\\.spec\\.(ts|tsx)$',
          '__tests__/',
          'e2e/',
        ],
      },
      to: {},
    },

    /* === FORBIDDEN DEPENDENCIES === */
    {
      name: 'no-deprecated-core',
      severity: 'warn',
      comment:
        'A core module that is deprecated. Find an alternative or ignore if necessary.',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: ['^(punycode|domain|constants|sys|_linklist|_stream_wrap)$'],
      },
    },

    /* === ARCHITECTURE RULES === */
    {
      name: 'not-to-test',
      severity: 'error',
      comment: 'Production code should not depend on test files',
      from: {
        pathNot: '\\.(spec|test)\\.(js|mjs|cjs|ts|tsx)$',
      },
      to: {
        path: '\\.(spec|test)\\.(js|mjs|cjs|ts|tsx)$',
      },
    },
    {
      name: 'not-to-dev-dep',
      severity: 'error',
      comment: 'Production code should not import dev dependencies',
      from: {
        path: '^(admin-panel|landing-pages)/src',
        pathNot: '\\.(spec|test)\\.(js|mjs|cjs|ts|tsx)$',
      },
      to: {
        dependencyTypes: ['npm-dev'],
      },
    },

    /* === FEATURE ISOLATION (Admin Panel) === */
    {
      name: 'feature-to-feature-isolation',
      severity: 'warn',
      comment:
        'Features should not directly import from other features. Use shared modules instead.',
      from: {
        path: '^admin-panel/src/features/([^/]+)/',
      },
      to: {
        path: '^admin-panel/src/features/([^/]+)/',
        pathNot: '^admin-panel/src/features/$1/', // Same feature is OK
      },
    },

    /* === LAYERED ARCHITECTURE === */
    {
      name: 'no-utils-to-features',
      severity: 'error',
      comment: 'Utilities should not depend on features (inverse dependency)',
      from: {
        path: '/utils/',
      },
      to: {
        path: '/features/',
      },
    },
    {
      name: 'no-hooks-to-pages',
      severity: 'warn',
      comment: 'Hooks should not directly import page components',
      from: {
        path: '/hooks/',
      },
      to: {
        path: '/pages/',
      },
    },
  ],

  options: {
    doNotFollow: {
      path: 'node_modules',
    },

    /* Tell dependency-cruiser to also look at TypeScript files */
    tsPreCompilationDeps: true,

    /* Where to find tsconfig.json */
    tsConfig: {
      fileName: 'admin-panel/tsconfig.json',
    },

    /* ESM/CJS resolution */
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      mainFields: ['module', 'main', 'types', 'typings'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },

    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/(@[^/]+/[^/]+|[^/]+)',
        theme: {
          graph: {
            splines: 'ortho',
          },
          modules: [
            {
              criteria: { source: '/components/' },
              attributes: { fillcolor: '#ccffcc' },
            },
            {
              criteria: { source: '/hooks/' },
              attributes: { fillcolor: '#ffccff' },
            },
            {
              criteria: { source: '/pages/' },
              attributes: { fillcolor: '#ccccff' },
            },
            {
              criteria: { source: '/utils/' },
              attributes: { fillcolor: '#ffffcc' },
            },
            {
              criteria: { source: '/features/' },
              attributes: { fillcolor: '#ffcccc' },
            },
          ],
          dependencies: [
            {
              criteria: { resolved: '/components/' },
              attributes: { color: '#00aa00' },
            },
            {
              criteria: { circular: true },
              attributes: { color: '#ff0000', width: 2 },
            },
          ],
        },
      },

      archi: {
        collapsePattern:
          '^(admin-panel|landing-pages)/src/(components|hooks|pages|utils|features)/[^/]+',
        theme: {
          modules: [
            {
              criteria: { source: '/components/' },
              attributes: { fillcolor: '#ccffcc' },
            },
            {
              criteria: { source: '/hooks/' },
              attributes: { fillcolor: '#ffccff' },
            },
            {
              criteria: { source: '/pages/' },
              attributes: { fillcolor: '#ccccff' },
            },
            {
              criteria: { source: '/features/' },
              attributes: { fillcolor: '#ffcccc' },
            },
          ],
        },
      },
    },
  },
};
