// Questerix Alert Channels Configuration
// Email alerts for all failures, Slack for P0 critical failures

export const alertChannels = [
  // Email alerts (always configured)
  {
    type: 'email',
    name: 'email-alerts',
    // Email addresses are configured in Checkly dashboard
    // Settings → Alert Channels → Email
  },
  
  // Slack webhook (optional - configure if you have Slack)
  // Uncomment and configure webhook URL in Checkly dashboard
  /*
  {
    type: 'slack',
    name: 'slack-alerts',
    // Webhook URL configured in Checkly dashboard
    // Settings → Alert Channels → Slack → Add Webhook
  },
  */

  // Status page updates (automatic for public status page)
  {
    type: 'status-page',
    name: 'status-page-updates',
    // Automatically creates incidents on the public status page
  },
];

// Alert escalation rules
export const alertEscalation = {
  // Alert after 2 consecutive failures (avoid false positives)
  consecutiveAlerts: 2,
  
  // Recovery notification when checks pass again
  sendRecoveryNotification: true,
  
  // Grace period between alerts (minutes)
  gracePeriod: 5,
};

// Alert routing by severity
export const alertRouting = {
  // P0 Critical - immediate Slack + email
  critical: {
    alertChannels: ['email-alerts', 'slack-alerts'],
    consecutiveAlerts: 1, // Alert immediately for critical
  },
  
  // P1 Important - email only, after 2 failures
  important: {
    alertChannels: ['email-alerts'],
    consecutiveAlerts: 2,
  },
  
  // P2 Canary - email only, after 3 failures
  canary: {
    alertChannels: ['email-alerts'],
    consecutiveAlerts: 3,
  },
};
