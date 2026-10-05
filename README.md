# Dentist Clinic CMS

API-first dental clinic CMS and public website built with Next.js 16, MongoDB and App Router.

## Architecture
- Public website, admin CMS and versioned API in one Next.js application.
- MongoDB/Mongoose domain models.
- JWT authentication with bcrypt password hashing.
- Persian/English content without language in URLs.
- Centralized media abstraction.
- SEO fields on public content models.
- Appointment/payment state machines designed for future mobile clients.
- Payment and SMS providers are managed as database-backed admin modules.

## Integration modules

Open **Admin → ماژول‌ها** to manage payment and SMS integrations.

Each integration module has:
- enabled/disabled state
- default-provider selection per integration type
- provider-specific configuration
- encrypted storage for sensitive credentials
- configuration validation and test status

Built-in modules:
- Payment: ZarinPal, Mock Gateway (development)
- SMS: IPPanel, Console SMS (development)

Adding another provider later only requires registering its module and implementing its provider adapter; appointment and authentication flows do not need to know the concrete provider.

## Security

Provider configuration is stored in MongoDB, not in .env.

Only the master encryption secret is kept outside the database:

INTEGRATION_ENCRYPTION_KEY=<long-random-secret>

This key is used to encrypt reversible credentials such as payment Merchant IDs and SMS API keys. Never commit the master key or provider credentials to Git.

Application-level settings such as the MongoDB URI, JWT secret, application URL and cron secret remain environment configuration.

## Production activation

1. Set INTEGRATION_ENCRYPTION_KEY on the server.
2. Open Admin → ماژول‌ها.
3. Configure ZarinPal and/or IPPanel.
4. Enable the module.
5. Mark the desired provider as the default for its type.
6. Use بررسی تنظیمات before using it for bookings/OTP.

### ZarinPal
The adapter uses the ZarinPal REST v4 request and verification endpoints. Booking fees are sent as integer Rial amounts.

### IPPanel
The adapter uses IPPanel Edge's webservice send endpoint with an API key, sender number and E.164 recipients. OTP and appointment reminder messages use the active SMS module.

## Callbacks and cron
- Payment callback: /api/v1/payment/callback
- Reminder cron: POST /api/v1/cron/reminders
- Scheduled publishing cron: POST /api/v1/cron/publish-scheduled

Protect cron endpoints with CRON_SECRET.

## Development
Copy .env.example to .env.local, install dependencies and run npm run dev.

IPPanel API reference: https://apidoc.ippanel.com/
