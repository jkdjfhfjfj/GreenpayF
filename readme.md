# Overview

GreenPay is a fintech mobile application for international money transfers, primarily remittances to Africa. It features a digital wallet with virtual card capabilities, KYC verification, secure transaction processing, and multi-currency support (USD and KES). The project aims to deliver a seamless and secure mobile-first money transfer service, supporting real-time tracking and a broad user base.

# User Preferences

Preferred communication style: Simple, everyday language.
Phone number formats: Users can enter phone numbers in multiple formats (712345678, 0712345678, +254712345678, 254712345678, or 00254712345678). All formats are automatically normalized to +254XXXXXXXXX for database storage and consistent lookups across authentication flows.

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript.
- **Routing**: Wouter.
- **State Management**: TanStack Query for server state, React hooks for local state.
- **UI Framework**: Shadcn/ui components built on Radix UI.
- **Styling**: Tailwind CSS with custom CSS variables, supporting light and dark modes.
- **Animations**: Framer Motion.
- **Form Management**: React Hook Form with Zod validation.
- **Design**: Mobile-first responsive UI with bottom navigation and PWA capabilities.

## Backend
- **Runtime**: Node.js with TypeScript.
- **Framework**: Express.js for RESTful APIs.
- **Data Storage**: Drizzle ORM for PostgreSQL.
- **Authentication**: Custom authentication with email/phone verification, OTP via SMS/WhatsApp/Email, and server-side session management using PostgreSQL.
- **Multi-Channel Messaging**: Concurrent message delivery via SMS, WhatsApp, and Email for critical notifications (OTP, password reset, transactions, login alerts, KYC updates, card activation).
- **File Management**: Cloudinary for user-uploaded files (KYC, profile photos, chat) - supports external hosting.
- **Dual-Wallet System**: Supports both USD and KES balances with exchange functionality.

## Data Layer
- Comprehensive database schema for users, KYC, virtual cards, transactions, and payment requests.
- Shared TypeScript types between frontend and backend using Drizzle-Zod.
- Zod schemas for runtime validation.

## UI/UX Decisions
- Consistent UI with Shadcn/ui and Radix UI.
- Theming with Tailwind CSS for light and dark modes.
- Roboto font and Material Icons for typography and iconography.
- Enhanced dashboard with gradient header, quick action cards, and improved visual hierarchy.
- Status page for real-time service health monitoring.
- SEO optimized with XML Sitemap, Global Meta Tags, Structured Data (JSON-LD), and page-specific meta tags.

## Feature Specifications
- Multi-factor authentication (OTP via SMS/WhatsApp/Email) with multi-channel delivery.
- Virtual card purchase with automated and manual payment options.
- Admin panel for managing API configurations, manual payment settings, and email/messaging configuration.
- Comprehensive user profile management.
- Live chat with file upload and download support.
- Airtime purchase system integrated with external API.
- KES-based withdrawals.
- Login history tracking with email/SMS/WhatsApp alerts.
- Seamless dual-wallet (USD/KES) functionality with currency exchange.
- KYC status display with resubmission improvements.
- Transaction statements with GreenPay branding and PDF export.
- Email notifications with branded HTML templates for all critical events (OTP, password reset, transactions, KYC updates, login alerts, card activation).

# External Dependencies

## Database & Storage
- **PostgreSQL**: Primary database (Neon serverless PostgreSQL).
- **Drizzle ORM**: Type-safe database operations.
- **connect-pg-simple**: PostgreSQL-based session storage.
- **Cloudinary**: Cloud-based file storage for user documents and media (images, PDFs, etc.). All files stored with "greenpay/" prefix for organization. Supports 25GB free storage, perfect for production deployment.

## UI & Design System
- **Radix UI**: Primitive components.
- **Tailwind CSS**: Utility-first CSS framework.
- **Google Fonts**: Roboto font family.
- **Lucide React**: Icon library.

## Third-Party Integrations
- **TanStack Query**: Server state management.
- **React Hook Form**: Form management.
- **Framer Motion**: Animation library.
- **Zod**: Runtime type validation.
- **TalkNTalk API**: SMS and WhatsApp messaging.
- **Nodemailer**: Email delivery via SMTP with support for multiple providers (Zoho, Gmail, etc.). Configured through admin panel.
- **Statum API**: Airtime top-ups.
- **PayHero**: Automated virtual card payments.
- **Paystack**: Payment processing.
- **exchangerate-api.com**: Live currency exchange rates (USD/KES).

## Email Configuration
Email messaging is configured through the admin panel at `/api/admin/email-settings`. Admins can configure:
- SMTP server hostname and port
- SSL/TLS security settings
- SMTP credentials (username/password)
- From email address and display name

The system sends beautiful, branded HTML emails for:
- OTP verification codes
- Password reset requests
- Transaction notifications
- Fund receipt confirmations
- Login security alerts
- KYC verification updates
- Virtual card activation

**Test Feature**: Admins can send test emails via `/api/admin/send-test-email` to verify configuration before going live.
