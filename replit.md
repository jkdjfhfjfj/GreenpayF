# Overview

GreenPay is a fintech mobile application designed for international money transfers, focusing on remittances to Africa. It provides a digital wallet with virtual card capabilities, KYC verification, and secure transaction processing. The application is a full-stack web application with a mobile-first design, offering multi-currency support and real-time transaction tracking. The project aims to provide seamless money transfer services to a broad user base.

# Recent Changes (October 21, 2025)

## Bug Fixes
- **Double Login Issue**: Fixed authentication race condition by adding delay between state update and navigation to ensure authentication state synchronizes properly before redirecting users to dashboard

## Admin Configuration System
- **API Configurations Table**: New database table `api_configurations` to store API credentials for Exchange Rate, Paystack, and PayHero services
- **Admin CRUD Operations**: Full storage layer support for managing API configurations (create, read, update, delete)
- **Admin API Endpoints**: 5 new endpoints under `/api/admin/api-configurations` for managing service credentials
- **Database-First Configuration**: Exchange Rate service now prioritizes database-stored credentials over environment variables, allowing runtime configuration updates
- **Security**: All admin configuration endpoints protected with `requireAdminAuth` middleware

## UI Modernization
- **Bottom Navigation Redesign**: Updated to modern style with elevated center button for Send Money, featuring 5 navigation items (Home, History, Send, Card, Profile) with gradient purple styling
- **Dashboard Restructure**: Redesigned with gradient header card, improved visual hierarchy, modern card-based layout for quick actions and services
- **Responsive Design**: Enhanced mobile-first experience with better spacing and visual appeal

## New Feature: Airtime Purchase
- **Airtime Page**: Complete airtime purchase interface with network provider selection (Safaricom, Airtel, Telkom)
- **Quick Select Amounts**: Pre-configured amounts in local currency (KSh 50, 100, 200, 500) for fast purchases
- **Backend API**: New endpoint `/api/airtime/purchase` for processing airtime transactions
- **Validation**: Supports purchases from $0.10 to $1000 USD
- **Integration**: Added to dashboard quick actions and services menu

# User Preferences

Preferred communication style: Simple, everyday language.
Phone numbers: Should start with 07 format (Kenya-specific)

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript.
- **Routing**: Wouter for lightweight client-side routing.
- **State Management**: TanStack Query for server state, React hooks for local state.
- **UI Framework**: Shadcn/ui components built on Radix UI primitives.
- **Styling**: Tailwind CSS with custom CSS variables, supporting light and dark modes.
- **Animations**: Framer Motion for transitions and interactive elements.
- **Form Management**: React Hook Form with Zod validation.

## Backend
- **Runtime**: Node.js with TypeScript.
- **Framework**: Express.js for RESTful APIs.
- **Data Storage**: In-memory storage (MemStorage) with interface-based architecture, designed for easy integration with a persistent database.
- **Database ORM**: Drizzle ORM for PostgreSQL.
- **Session Management**: Connect-pg-simple for PostgreSQL-based session storage.

## Authentication & Security
- Custom authentication with email/phone verification.
- Basic password handling (to be upgraded to bcrypt for production).
- Server-side session management with PostgreSQL.
- LocalStorage for client-side session persistence.

## Data Layer
- Comprehensive database schema for users, KYC, virtual cards, transactions, and payment requests.
- Shared TypeScript types between frontend and backend using Drizzle-Zod.
- Zod schemas for runtime validation.

## Mobile-First Design
- Responsive UI with mobile-optimized interactions and bottom navigation.
- Configured for Progressive Web App (PWA) capabilities.
- Framer Motion for smooth mobile gestures.

## UI/UX Decisions
- Consistent UI with Shadcn/ui and Radix UI.
- Theming with Tailwind CSS for light and dark modes.
- Roboto font and Material Icons for typography and iconography.

## Technical Implementations
- Robust error handling and logging middleware in Express.js.
- Custom middleware for secure file access via object storage.
- Real-time updates for KYC status and payment options.

## Feature Specifications
- Multi-factor authentication (OTP via SMS/WhatsApp) for login.
- Virtual card purchase with automated (PayHero) and manual (M-Pesa) payment options.
- Admin panel for managing messaging credentials and manual payment settings.
- Comprehensive user profile management with photo upload and password change functionality.
- Live chat with image upload capabilities.
- Cascading deletion for user data across all related tables.

# External Dependencies

## Database & Storage
- **PostgreSQL**: Primary database, using Neon serverless PostgreSQL for scalability.
- **Drizzle ORM**: For type-safe database operations.
- **connect-pg-simple**: For PostgreSQL-based session storage.
- **Replit Object Storage**: For KYC documents, chat uploads, and profile photos.

## UI & Design System
- **Radix UI**: Primitive components for UI.
- **Tailwind CSS**: Utility-first CSS framework.
- **Google Fonts**: Roboto font family.
- **Lucide React**: Icon library.

## Development & Build Tools
- **Vite**: Fast build tool and development server.
- **TypeScript**: For full-stack type safety.
- **ESBuild**: For production bundling.
- **PostCSS**: CSS processing.

## Third-Party Integrations
- **TanStack Query**: Server state management.
- **React Hook Form**: Form management with validation.
- **Framer Motion**: Animation library.
- **Zod**: Runtime type validation.
- **TalkNTalk API**: For SMS and WhatsApp messaging.