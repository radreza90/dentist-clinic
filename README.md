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

## Development
Copy `.env.example` to `.env.local`, install dependencies and run `npm install` then `npm run dev`.
