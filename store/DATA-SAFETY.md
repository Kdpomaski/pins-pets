# Pins Pets — Play Data safety & Apple privacy answers

Use these exact answers in Play Console → App content → Data safety
and App Store Connect → App Privacy.

## Data collected
| Data | Collected | Linked to identity | Used for tracking |
|---|---|---|---|
| Email (if they sign up) | Yes | Yes (account) | No |
| Age range (onboarding) | Yes | Yes (account) | No |
| Gender (onboarding) | Yes | Yes (account) | No |
| Pet health logs | No (device only) | — | — |
| Location | No | — | — |
| Photos | No | — | — |
| Contacts | No | — | — |
| Advertising ID | No | — | — |
| Analytics | No | — | — |

## Purposes
- Email: Account management
- Age range & gender: App functionality (anonymous product stats)

## Encryption
- In transit: Yes (HTTPS to Supabase if they sign in)
- At rest on device: Yes (AES-256-GCM)
- Users can request deletion: Yes (email support)

## Tracking
Not used. Do not check “Used for tracking” on Apple.
