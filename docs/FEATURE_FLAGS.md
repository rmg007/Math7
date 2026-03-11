# Questerix — Feature Flags & App Configuration

Multi-tenant applications in Questerix use the `apps.features` JSONB column to control functionality and behavior per tenant (subdomain).

## 1. Registry (Identified Flags)

The following keys are expected by the Student App and should be managed via the Admin Panel's App Settings.

| Key                  | Type    | Default | Description                                                                              |
| :------------------- | :------ | :------ | :--------------------------------------------------------------------------------------- |
| `min_app_version`    | String  | `0.0.0` | Minimum version required to run. Throws initialization error if current version < this.  |
| `latest_app_version` | String  | `0.0.0` | Latest version available. Used for update prompts.                                       |
| `ios_store_url`      | String  | (empty) | URL to transition the user to for iOS updates.                                           |
| `android_store_url`  | String  | (empty) | URL to transition the user to for Android updates.                                       |
| `basic_navigation`   | Boolean | `true`  | Enables/disables basic app navigation. (Whitelisted as default-open).                    |
| `tts_enabled`        | Boolean | `true`  | Enables/disables Text-to-Speech in the audio service. Defaults to true if not specified. |

## 2. Validation Pattern

The `apps` table's `features` column stores these values.

> [!WARNING]
> The Admin Panel currently lacks strict Zod validation for these JSON keys. Manual editing in `AppsPage.tsx` or Direct SQL is required for now.

## 3. Implementation Policy

- **Default posture**: "Default Closed" for security-critical features; "Default Open" for core usability.
- **Accessing from Student App**: Use `AppContext.isFeatureEnabled('key')` or dedicated getters.
- **Admin Management**: Direct JSON editing in `AppsPage.tsx` or via DB.
