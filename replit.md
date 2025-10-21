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
- **Icon Alignment Fixed**: Improved text and icon alignment across dashboard cards for better visual consistency
- **Card Requirement Notifications**: Users without virtual cards now see "Card required" labels on disabled actions and receive helpful toast notifications when attempting to use send/receive/withdraw features
- **Responsive Design**: Enhanced mobile-first experience with better spacing and visual appeal

## Airtime Purchase System
- **Airtime Page**: Complete airtime purchase interface with network provider selection (Safaricom, Airtel, Telkom)
- **Quick Select Amounts**: Pre-configured KES amounts (5, 10, 20, 50, 100, 200) for fast purchases
- **Real API Integration**: Uses Statum API (https://api.statum.co.ke/api/v2/airtime) with HTTP Basic Auth for actual airtime top-ups
- **Backend API**: Endpoint `/api/airtime/purchase` processes real purchases and deducts from KES wallet
- **Validation**: Minimum KSh 5, Maximum KSh 10,000 per purchase
- **KES-Only**: Uses KES wallet balance exclusively; currency selector locked to KES
- **Bonus System**: One-time KES 15 airtime bonus claimable from dashboard, redirects to airtime page after claim
- **Phone Format**: Automatic conversion to 254XXXXXXXXX format for Kenyan numbers
- **Transaction Tracking**: Stores Statum transaction IDs and API responses in transaction metadata

## Dual-Wallet System Implementation
- **Database Schema**: Added `kesBalance` (decimal) and `hasReceivedWelcomeBonus` (boolean) fields to users table
- **Wallet Switcher UI**: Dashboard toggle allowing users to switch between USD and KES wallet views
- **Balance Display**: Shows active wallet balance prominently with "Other wallet" balance displayed below
- **Welcome Bonus**: New users see notification about KES 10 welcome bonus (awaiting API integration for actual crediting)
- **Exchange Page Enhancements**:
  - Dual wallet balances displayed at top for easy reference
  - Quick Convert presets: $5, $10, $20, $50, $100 buttons for rapid conversions
  - Helpful tip directing users to convert USD to KES for airtime and withdrawals
- **Currency Exchange Backend**:
  - Updated `/api/exchange/convert` endpoint to atomically update both USD and KES balances
  - Balance validation includes 1.5% exchange fee before conversion
  - USD→KES: Deducts from USD balance, credits KES balance
  - KES→USD: Deducts from KES balance, credits USD balance
  - Clear error messages for insufficient funds
- **Technical Debt**: Exchange endpoint uses read-modify-write pattern; should be wrapped in database transaction to prevent race conditions in production

## Login History Tracking
- **Database Table**: New `login_history` table tracking user login events with ipAddress, userAgent, deviceType, browser, location, status, and timestamp
- **Backend Tracking**: Login history automatically saved on both direct login and OTP verification paths
- **Device Detection**: System extracts device type (Mobile/Desktop/Tablet), browser name, and operating system from user-agent
- **Storage Layer**: Methods `createLoginHistory` and `getLoginHistoryByUserId` for managing login records
- **API Endpoint**: GET `/api/users/:id/login-history` returns recent login events for authenticated users
- **Dashboard Display**: "Recent Logins" section shows last 5 login events with device info, browser, location, timestamp, and success/failure status
- **React Query Fix**: Uses stable query key with custom queryFn to properly handle user authentication state hydration

## Enhanced Balance Card (Dashboard)
- **User Country Display**: Shows user's country with location icon next to balance label
- **KYC Verification Icon**: Green verified checkmark displayed when user has completed KYC
- **Quick Exchange Access**: Prominent "Exchange" button with currency exchange icon positioned next to "Other wallet" balance for easy USD↔KES conversion

## KES-Based Withdrawals
- **Currency Switch**: Withdraw page now uses KES balance instead of USD balance
- **Minimum Amount**: Updated from $10 minimum to KSh 100 minimum withdrawal
- **Fees in KES**: All withdrawal fees displayed in local currency (KSh 200-400 depending on method)
- **Conversion Prompts**: Blue info box appears when user has insufficient KES balance, directing them to exchange page
- **Currency Labels**: Updated all UI labels to show "KSh" prefix instead of "$" for clarity

## File Storage Migration
- **Replit Object Storage**: Migrated all file storage from Google Cloud Storage to Replit Object Storage
- **Bucket Configuration**: Using bucket ID `replit-objstore-6f67444f-b771-4c8f-bea8-fd3ebf96c798` (alias: UnsteadyKindlyMigration)
- **Access Control**: Simplified to authentication-based access (any authenticated user can access files); UUID-based keys prevent guessing
- **File Types**: Handles KYC documents, profile photos, and chat file uploads
- **Comprehensive Logging**: Emoji-based logging throughout (📤 uploads, 📥 downloads, ✅ success, ❌ errors)

## System Monitoring
- **Status Page**: New `/status` route showing real-time health checks for all services
- **Service Checks**: Database, Object Storage, Exchange Rate API, Statum, Paystack, PayHero, WhatsApp services
- **Auto-Refresh**: Status page auto-refreshes every 30 seconds
- **Color-Coded**: Visual status badges (healthy/degraded/unhealthy) with detailed messages
- **Navigation**: Accessible from dashboard services grid

## UX Improvements
- **Login Modal Removed**: Eliminated the 75% discount virtual card purchase modal that appeared 2 seconds after user login, providing cleaner dashboard experience
- **Airtime Bonus Flow**: After claiming KES 15 bonus, users automatically redirected to airtime purchase page

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