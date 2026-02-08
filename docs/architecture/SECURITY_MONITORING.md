# Security Monitoring & Alerts Implementation

> **Status**: Implemented (Database Layer)  
> **Version**: 1.0  
> **Last Updated**: 2026-02-02

## 1. Overview
This document defines the architecture for the "Security as a Feature" initiative. We utilize a **Tiered Logging Strategy** to provide real-time visibility into security events for Admins, Schools, and even Students, turning compliance into a visible USP.

## 2. Database Schema (`security_logs`)

We have introduced a dedicated, high-performance logging table: `public.security_logs`.

### Schema Details
| Column | Type | Purpose |
| :--- | :--- | :--- |
| `id` | UUID | Unique Identifier |
| `created_at` | TIMESTAMPTZ | Event timestamp (Indexed) |
| `app_id` | UUID | Context (Math7, Science8) |
| `user_id` | UUID | Who performed the action |
| `event_type` | TEXT | `login`, `logout`, `export`, `view_sensitive` |
| `severity` | TEXT | `info`, `low`, `medium`, `high`, `critical` |
| `ip_address` | TEXT | Source IP |
| `location` | TEXT | Geo-location (e.g., "New York, US") |
| `risk_score` | INT | 0-100 calculated risk |
| `metadata` | JSONB | Context-specific details |

### Performance Strategy
*   **Indexing**: `BRIN` index on `created_at` for efficient time-range queries (e.g., "Last 24 hours").
*   **Retention**: 90-Day Rolling Window automated by `cleanup_security_logs()`.

## 3. Risk Scoring & Detection (Heuristics)

The system assigns a basic risk score on ingestion via the `log_security_event` RPC.

*   **Critical (90)**: Mass Data Export, Admin Schema Changes, Password Brute Force.
*   **High (75)**: Login from new country, Failed login threshold exceeded.
*   **Medium (50)**: Login from new device, Profile edit.
*   **Info (0)**: Standard login, navigation.

## 4. Implementation Guide

### A. Logging an Event (Frontend/Backend)
Use the Supabase RPC function `log_security_event`.

```typescript
const { data, error } = await supabase.rpc('log_security_event', {
  p_event_type: 'export_data',
  p_severity: 'critical',
  p_metadata: { 
    exported_records: 500, 
    reason: 'Teacher Review' 
  },
  p_app_id: currentAppId
});
```

### B. Consuming Logs (Admin Dashboard)
Query the logs for the specific view.

```typescript
// "Live Threat Map" or Activity Feed
const { data } = await supabase
  .from('security_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(50);
```

### C. Data Retention & Cleanup
To limit database growth, we enforce a strict 90-day retention policy for Tier 1 logs.
**Automated Cleanup**:
Calls `cleanup_security_logs(90)` daily.

## 5. Security Policies (RLS)
*   **Admins**: Can view **ALL** logs.
*   **Users**: Can view **THEIR OWN** logs (e.g., for "Recent Devices" screen).
*   **Public**: No access.

## 6. Future Enhancements
*   **Automated Email Alerts**: Trigger Edge Function on `INSERT` where `severity = 'critical'`.
*   **GeoIP Integration**: Integrate MaxMind or similar in an Edge Function to auto-populate `location` derived from `ip_address`.
