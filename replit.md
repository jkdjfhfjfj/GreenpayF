# GreenPay

## Overview

GreenPay is a fintech mobile application for international money transfers, primarily focused on remittances to Africa (specifically Kenya). The platform features a digital wallet with dual-currency support (USD/KES), virtual card capabilities, KYC verification, secure transactions, and multi-channel messaging for notifications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing**
- React 18 with TypeScript as the core framework
- Wouter for lightweight client-side routing
- TanStack Query for server state management and API calls
- React Hook Form with Zod for form validation

**UI & Styling**
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS with CSS variables for theming (light/dark mode support)
- Framer Motion for animations
- Mobile-first responsive design with PWA capabilities
- Material Icons and Roboto font for consistent typography

**Build Configuration**
- Vite as the build tool and dev server
- Path aliases configured: `@/` for client source, `@shared/` for shared types

### Backend Architecture

**Runtime & Framework**
- Node.js with TypeScript (ESM modules)
- Express.js for RESTful API routes
- Session-based authentication using PostgreSQL-backed session store

**API Structure**
- All API routes prefixed with `/api/`
- Authentication endpoints: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`
- Financial endpoints: transactions, deposits, withdrawals, exchange
- User management: profile, KYC, virtual cards
- Admin endpoints for system management

**File Upload Handling**
- Multer for multipart form data processing
- Cloudinary for cloud file storage (KYC documents, profile photos, chat files)
- Supports images, PDFs, documents, and videos up to 10MB

### Data Layer

**Database**
- PostgreSQL via Neon serverless driver
- Drizzle ORM for type-safe database queries
- Schema defined in `shared/schema.ts` with Drizzle-Zod for validation

**Key Tables**
- `users`: Core user accounts with dual-wallet balances (USD/KES)
- `kyc_documents`: Identity verification documents
- `virtual_cards`: User virtual card details
- `transactions`: All financial transaction records
- `recipients`: Saved transfer recipients
- `conversations/messages`: Live chat support system
- `system_settings`: Dynamic configuration storage
- `api_configurations`: Third-party API credentials

**Session Management**
- PostgreSQL-backed sessions via `connect-pg-simple`
- Sessions stored in `user_sessions` table
- Secure cookie configuration with environment-aware settings

### Authentication & Security

**Multi-Factor Authentication**
- Email/phone OTP verification
- TOTP-based 2FA with backup codes (speakeasy library)
- WebAuthn biometric authentication support
- PIN-based transaction authorization

**Session Security**
- HTTP-only secure cookies
- SameSite cookie policy
- Session regeneration on login

### External Service Integrations

**Messaging Services**
- SMS: TalkNTalk Africa API
- WhatsApp: Meta WhatsApp Business API (Graph API v24.0)
- Email: Nodemailer with SMTP (Zoho) or Mailtrap for transactional emails

**Payment Processors**
- PayHero: M-Pesa STK push for Kenya
- Paystack: Card payments and mobile money
- Stripe: International card processing

**Other Services**
- Cloudinary: File storage and media management
- Exchange Rate API: Currency conversion rates
- Statum: Airtime purchases
- Google AI (Gemini): AI chat assistant

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- Connection via `@neondatabase/serverless` package with WebSocket support

### Cloud Storage
- **Cloudinary**: File uploads for KYC, profiles, and chat
- Environment variables: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Payment APIs
- **PayHero**: `PAYHERO_USERNAME`, `PAYHERO_PASSWORD`, `PAYHERO_CHANNEL_ID`
- **Paystack**: `PAYSTACK_SECRET_KEY`, `PAYSTACK_SECRET_KEY_KES`
- **Stripe**: `STRIPE_SECRET_KEY`

### Messaging APIs
- **WhatsApp Meta API**: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
- **SMS (TalkNTalk)**: Configured via system settings in database
- **Email SMTP**: Configured via system settings or Mailtrap API

### Other APIs
- **Exchange Rate API**: `EXCHANGERATE_API_KEY`
- **Google AI**: `GOOGLE_AI_API_KEY`
- **Statum Airtime**: `STATUM_CONSUMER_KEY`, `STATUM_CONSUMER_SECRET`

### Deployment
- Railway configuration included (`railway.json`)
- Render deployment guide available
- Environment variables: `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV`