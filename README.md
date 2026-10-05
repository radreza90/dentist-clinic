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
- Payment gateway abstraction with Mock (development) and ZarinPal REST v4 (production).
- SMS provider abstraction with Console (development) and IPPanel Edge API (production).

## Production providers

Copy `.env.example` to `.env.local` and configure secrets outside source control.

### ZarinPal
Set:
- `PAYMENT_DRIVER=zarinpal`
- `ZARINPAL_MERCHANT_ID=<merchant-id>`
- `ZARINPAL_API_BASE_URL=https://api.zarinpal.com`
- `ZARINPAL_STARTPAY_BASE_URL=https://www.zarinpal.com/pg/StartPay`

The integration calls the v4 payment request and verification APIs. Service booking fees are stored and sent as integer Rial amounts.

### IPPanel
Set:
- `SMS_DRIVER=ippanel`
- `IPPANEL_API_KEY=<api-key>`
- `IPPANEL_FROM_NUMBER=<sender-number>`
- `IPPANEL_API_URL=https://edge.ippanel.com/v1/api/send`

OTP messages and appointment reminder messages use this provider automatically.

### Callbacks and cron
- Payment callback: `/api/v1/payment/callback`
- Reminder cron: `POST /api/v1/cron/reminders`
- Scheduled publishing cron: `POST /api/v1/cron/publish-scheduled`

Protect cron endpoints with `CRON_SECRET`.

## Development
Copy `.env.example` to `.env.local`, install dependencies and run `npm run dev`.
