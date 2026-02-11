module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:4173/login',
        'http://localhost:4173/dashboard',
        'http://localhost:4173/domains',
        'http://localhost:4173/skills',
        'http://localhost:4173/questions',
        'http://localhost:4173/ai-import'
      ],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
