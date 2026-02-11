import { defineConfig } from 'checkly';

// Questerix Production Monitoring Configuration
// Uses Checkly Hobby free tier: 10 uptime monitors, 4 locations, 2-min frequency

export default defineConfig({
  projectName: 'questerix-monitoring',
  logicalId: 'questerix-monitoring-project',
});
