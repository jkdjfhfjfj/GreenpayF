# Overview

GreenPay is a fintech mobile application for international money transfers, primarily remittances to Africa. It features a digital wallet with virtual card capabilities, KYC verification, secure transaction processing, and multi-currency support (USD and KES). The project aims to deliver a seamless and secure mobile-first money transfer service, supporting real-time tracking and a broad user base.

# User Preferences

Preferred communication style: Simple, everyday language.
Phone number formats: Users can enter phone numbers in multiple formats (712345678, 0712345678, +254712345678, 254712345678, or 00254712345678). All formats are automatically normalized to +254XXXXXXXXX for database storage and consistent lookups across authentication flows.

# Recent Changes (October 21, 2025)

## Dual-Wallet Withdrawal and Admin Deposit Fixes
- **Issue**: Withdrawal insufficient funds error due to USD/KES balance conflict; admin deposits always went to USD wallet
- **Withdrawal Fix** (server/routes.ts):
  - Fixed balance check to use correct wallet based on withdrawal currency
  - KES withdrawals now check `kesBalance`, USD withdrawals check `balance`
  - Balance calculation filters transactions by currency (only counts matching-currency transactions)
  - Error response includes currency field for better clarity
- **Admin Deposit Fix** (server/routes.ts):
  - Added `currency` parameter to admin balance adjustment endpoint (defaults to USD for backward compatibility)
  - Routes deposits to correct wallet: `kesBalance` for KES, `balance` for USD
  - Transaction type changed from 'receive' to 'deposit' for admin deposits
  - Transaction records now labeled with correct target currency
- **Admin Panel UI** (client/src/components/admin/enhanced-user-management.tsx):
  - Added currency selector dropdown (USD / KES) in balance adjustment form
  - Display both USD and KES balances with color coding (blue for USD, green for KES)
  - Form layout enhanced to 3-column grid (Action, Currency, Amount)
  - Proper props threading for currency state management
- **Impact**: 
  - Users can now withdraw KES funds without "insufficient funds" errors
  - Admins can deposit to either USD or KES wallet with proper transaction labeling
  - Transaction log shows correct currency badges for all admin deposits

## Number Formatting and Transaction Enhancement
- **Comma Separators**: All balance displays now show comma-separated numbers (e.g., $1,234.56)
  - Created `formatNumber()` utility function
  - Applied throughout dashboard, transactions, and monthly summaries
- **Currency Differentiation**: Transaction log uses color-coded badges
  - Blue badges for USD transactions
  - Green badges for KES transactions
- **PDF Export**: Professional transaction statements with GreenPay branding
  - jsPDF integration with auto-table support
  - Includes user info, summary statistics, and formatted transaction table
  - Downloads as "GreenPay_Statement_YYYY-MM-DD.pdf"

## Comprehensive SEO Optimization for Google Search Rankings
- **Implementation**: Complete SEO infrastructure for maximum Google visibility and search rankings
- **XML Sitemap** (16 URLs - 220% increase):
  - Available at `/sitemap.xml` with optimized priorities and change frequencies
  - Core pages: Home (1.0 priority), Login (0.9), Signup (0.9), Status (0.7)
  - Auth flow: Forgot Password (0.5), Reset Password (0.4), OTP Verification (0.4)
  - Feature landing pages: Send Money (0.9), Virtual Cards (0.9), Exchange (0.8), Airtime (0.8)
  - Info pages: About (0.7), Pricing (0.8), Security (0.7), Help (0.8), Contact (0.7)
  - Protected routes excluded from crawling (dashboard, admin, API)
  - Daily auto-updates for last modified date
  - Cache-Control headers for optimal crawling
- **Global Meta Tags** (index.html):
  - SEO-optimized title and description with target keywords
  - Open Graph tags for Facebook/LinkedIn sharing
  - Twitter Card metadata for Twitter sharing
  - Keywords: "send money to Kenya", "USD to KES", "virtual card", "M-Pesa", "international remittance"
  - Canonical URL, robots directives, geo-targeting (Kenya)
  - Language tags (en-US)
- **Structured Data** (JSON-LD schemas for rich snippets):
  - **FinancialService schema**: Company details, services offered, 4.8/5 rating, contact info
  - **Organization schema**: Business info, contact points, social media links
  - **FAQPage schema**: Common questions for search result rich snippets
- **Page-Specific Meta Tags** (9 unique landing pages with react-helmet-async):
  - `/features/send-money`: "Send Money to Kenya Instantly" - targets Kenya remittance keywords
  - `/features/virtual-cards`: "Virtual Mastercard for Online Shopping" - targets virtual card keywords
  - `/features/exchange`: "USD to KES Exchange Rate" - targets forex/exchange keywords
  - `/features/airtime`: "Buy Airtime for Kenya" - targets Safaricom, Airtel, Telkom keywords
  - `/help`: "Help Center & FAQ" - includes additional FAQ structured data
  - `/about`: "About GreenPay" - targets Kenya diaspora, remittance company keywords
  - `/pricing`: "Pricing & Fees" - targets transparent pricing keywords
  - `/security`: "Security & Compliance" - targets KYC, AML, encryption keywords
  - `/contact`: "Contact Support" - targets customer support keywords
  - Each page has unique title, description, keywords, canonical URL, Open Graph, and Twitter metadata
- **Technical SEO**:
  - HelmetProvider wrapping entire app for dynamic meta tag rendering
  - Reusable SEO component for consistent metadata structure
  - No duplicate content across URLs
  - All pages mobile-responsive with clear CTAs
  - Robots.txt with proper allow/disallow directives
- **Target Keywords Coverage**:
  - "send money to Kenya" ✓
  - "USD to KES exchange" / "USD to KES" ✓
  - "virtual card" / "virtual Mastercard" ✓
  - "Kenya airtime" / "Safaricom airtime" ✓
  - "international money transfer" ✓
  - "M-Pesa" ✓
  - "Kenya remittance" ✓
- **Submission URLs**:
  - XML Sitemap: `https://greenpay.world/sitemap.xml`
  - Robots.txt: `https://greenpay.world/robots.txt`
- **Status**: Production-ready for Google Search Console submission
- **Impact**: Comprehensive SEO positioning GreenPay to rank highly on Google for Kenya money transfer searches

## Currency Restriction to USD and KES Only
- **Issue**: App supported multiple African currencies (NGN, GHS, ZAR, etc.) that were not actually functional
- **Solution**:
  - **Exchange Rate API**: Verified working (exchangerate-api.com returns live USD/KES rates ~129.27)
  - **Currency Dropdowns**: Removed all currencies except USD and KES from:
    - Exchange page (was 8 currencies, now 2)
    - Send money page (removed Nigeria, Ghana, South Africa, Uganda, Tanzania, Rwanda - kept only Kenya)
    - Send amount page (was 7 currencies, now 2)
    - Payment requests page (was 5 currencies, now 2)
    - Deposit page (was 5 currencies, now 2)
    - Settings page (was 7 currencies, now 2)
  - **Mock Data**: Updated mockCurrencies and mockExchangeRates to only include USD/KES
  - **Exchange Rate Service**: Updated fallback rates to only support USD ↔ KES conversions
  - **Server Routes**: Updated exchange rate targets array from ['NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'XOF', 'XAF'] to ['KES']
  - **Display Updates**: Fixed hardcoded NGN references in send-confirm, withdraw, and dashboard pages
- **Impact**: App now only supports USD and KES currencies throughout, matching actual payment capabilities

## KYC Status Display and Resubmission Improvements
- **Issue**: Dashboard KYC banner showed generic message for all non-verified statuses; rejected users couldn't resubmit documents
- **Solution**:
  - **Dashboard Banner**: Three status-specific banners with appropriate colors and messages:
    - Pending (blue): "Documents Under Review" - shows when KYC is awaiting admin verification
    - Rejected (red): "Verification Failed" - prompts user to resubmit with clear CTA
    - Not Submitted (amber): "Verify Your Identity" - initial KYC prompt
  - **KYC Resubmission Flow**:
    - Removed blocking screen for rejected users
    - Added rejection notice banner showing admin-provided reason
    - Users can now access form and upload new documents
    - File validation ensures all documents uploaded before submission
    - Step-by-step validation prevents skipping required uploads
  - **File Upload Validation**:
    - Step 2 validation: Must upload front and back documents to proceed
    - Final validation: All three files (front, back, selfie) required for submission
    - Clear error toasts guide users to upload missing documents
- **Impact**: Better UX with clear status communication and seamless KYC resubmission for rejected users

# Recent Changes (October 21, 2025)

## Phone Number Formatting Consistency Fix
- **Issue**: Reset password returned "user not found" even though user exists
- **Root Cause**: Phone numbers stored with + prefix (+254712345678) but formatPhoneNumber returned without + (254712345678), causing database lookup failures
- **Solution**:
  - Updated `formatPhoneNumber()` to always return phone with + prefix (+254XXXXXXXXX)
  - Added phone formatting to signup endpoint to ensure consistency
  - Handles all input formats: +254xxx, 00254xxx, 0xxx, 254xxx, 7xxx, 1xxx
  - Updated forgot-password placeholder for clarity
- **Impact**: Forgot password flow now works correctly, users can enter phone in any format

## Object Storage Result Unwrapping Fix  
- **Issue**: File viewing was broken - `getMetadata()` doesn't exist in Replit Object Storage client
- **Root Cause**: 
  - Result objects must be unwrapped using `result.ok` and `result.value`
  - `downloadAsBytes()` returns `[Buffer]` tuple, not raw `Buffer`
  - StorageObject uses `name` property, not `key`
- **Solution**: 
  - Properly unwrap Result objects: `if (!result.ok)` checks, `result.value` extraction
  - Destructure Buffer from tuple: `const [buffer] = downloadResult.value as [Buffer];`
  - Fixed listFiles: `obj.name` instead of `obj.key`
  - Distinguish 404 (file not found) from 500 (storage error)
  - Extension-based MIME type detection
  - Enhanced logging for debugging file downloads
- **Impact**: Profile photos, KYC documents, and chat files now viewable with correct binary content

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
- **Authentication**: Custom authentication with email/phone verification, OTP via SMS/WhatsApp, and server-side session management using PostgreSQL.
- **File Management**: Replit Object Storage for user-uploaded files (KYC, profile photos, chat).
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

## Feature Specifications
- Multi-factor authentication (OTP via SMS/WhatsApp).
- Virtual card purchase with automated and manual payment options.
- Admin panel for managing API configurations and manual payment settings.
- Comprehensive user profile management.
- Live chat with image upload.
- Airtime purchase system integrated with external API.
- KES-based withdrawals.
- Login history tracking.
- Seamless dual-wallet (USD/KES) functionality with currency exchange.

# External Dependencies

## Database & Storage
- **PostgreSQL**: Primary database (Neon serverless PostgreSQL).
- **Drizzle ORM**: Type-safe database operations.
- **connect-pg-simple**: PostgreSQL-based session storage.
- **Replit Object Storage**: File storage for user documents and media.

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
- **Statum API**: Airtime top-ups.
- **PayHero**: Automated virtual card payments.
- **Paystack**: Payment processing.