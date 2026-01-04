# GreenPay - Fintech Money Transfer Application

## Overview

GreenPay is a comprehensive fintech mobile application for international money transfers, primarily focused on remittances to Africa (Kenya). The platform features a dual-wallet system (USD/KES), virtual card capabilities, KYC verification, multi-channel messaging (SMS, WhatsApp, Email), and a complete admin panel for system management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack Query for server state, React hooks for local state
- **UI Components**: Shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Animations**: Framer Motion for transitions and micro-interactions
- **Form Handling**: React Hook Form with Zod validation schemas
- **Design Approach**: Mobile-first responsive design with PWA capabilities and bottom navigation

### Backend Architecture
- **Runtime**: Node.js with TypeScript (ESM modules)
- **Framework**: Express.js for RESTful API endpoints
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Management**: express-session with PostgreSQL store (connect-pg-simple)
- **File Uploads**: Multer for handling multipart form data
- **Build Tool**: esbuild for server bundling

### Data Layer
- **Database**: PostgreSQL (Neon serverless recommended for deployment)
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Type Generation**: Drizzle-Zod for automatic TypeScript types and runtime validation
- **Key Tables**: users, kyc_documents, virtual_cards, transactions, recipients, payment_requests, conversations, messages, system_settings, api_configurations

### Authentication & Security
- **Auth Method**: Custom session-based authentication with email/phone verification
- **OTP Delivery**: Multi-channel (SMS via TalkNTalk, WhatsApp via Meta Business API, Email via Mailtrap/SMTP)
- **2FA**: TOTP-based two-factor authentication with backup codes
- **Biometrics**: WebAuthn support for biometric login
- **PIN Protection**: Optional 4-digit PIN for transaction authorization

### File Storage
- **Primary**: Cloudinary for cloud-based file storage (KYC documents, profile photos, chat files)
- **Legacy**: Replit Object Storage (only works on Replit, migration required for external hosting)
- **Configuration**: Environment variables for Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)

### Payment Integrations
- **M-Pesa (Kenya)**: PayHero API for STK push payments
- **Card Payments**: Paystack for card and bank transfers
- **Airtime**: Statum API for airtime purchases

### Messaging Services
- **SMS**: TalkNTalk Africa API
- **WhatsApp**: Meta WhatsApp Business API (Graph API v24.0)
- **Email**: Mailtrap for transactional emails with HTML templates

### AI Integration
- **Provider**: Google Generative AI (Gemini 2.5 Flash)
- **Purpose**: Customer support chat widget with rate limiting (5 requests/day per user)

## External Dependencies

### Required Environment Variables
```
DATABASE_URL          # PostgreSQL connection string (Neon recommended)
SESSION_SECRET        # Random string for session encryption
CLOUDINARY_CLOUD_NAME # Cloudinary account name
CLOUDINARY_API_KEY    # Cloudinary API key
CLOUDINARY_API_SECRET # Cloudinary API secret
```

### Optional API Integrations
```
PAYHERO_USERNAME / PAYHERO_PASSWORD    # M-Pesa payments
PAYSTACK_SECRET_KEY                    # Card payments
STATUM_CONSUMER_KEY / SECRET           # Airtime purchases
WHATSAPP_ACCESS_TOKEN / PHONE_NUMBER_ID # WhatsApp messaging
MAILTRAP_API_KEY                       # Email delivery
GOOGLE_AI_API_KEY                      # AI chat support
EXCHANGERATE_API_KEY                   # Currency exchange rates
```

### Deployment Platforms
- **Recommended**: Render.com with Neon PostgreSQL
- **Alternative**: Railway with built-in PostgreSQL
- **Configuration Files**: `railway.json` for Railway, `render.yaml` (to be created) for Render

### Third-Party Services
- **Database**: Neon PostgreSQL (serverless, connection pooling)
- **File Storage**: Cloudinary (25GB free tier)
- **Payments**: PayHero (M-Pesa), Paystack (cards)
- **Messaging**: TalkNTalk (SMS), Meta (WhatsApp), Mailtrap (Email)
- **AI**: Google Gemini
- **Currency Rates**: ExchangeRate-API