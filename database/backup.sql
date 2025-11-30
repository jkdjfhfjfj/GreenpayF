-- GreenPay Database Backup Script
-- This file exports all data from GreenPay database tables
-- Usage: psql -U postgres -d greenpay -f backup.sql > greenpay_backup_$(date +%Y%m%d_%H%M%S).sql

-- Export all tables in dependency order (respecting foreign keys)
-- Users table (core table, no dependencies)
COPY users TO STDOUT WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\') \g '/tmp/users.csv'

-- Admins table (core table, no dependencies)
COPY admins TO STDOUT WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\') \g '/tmp/admins.csv'

-- KYC Documents
COPY kyc_documents TO STDOUT WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\') \g '/tmp/kyc_documents.csv'

-- Virtual Cards
COPY virtual_cards TO STDOUT WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\') \g '/tmp/virtual_cards.csv'

-- Recipients
COPY recipients TO STDOUT WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\') \g '/tmp/recipients.csv'

-- Transactions
COPY transactions TO STDOUT WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\') \g '/tmp/transactions.csv'

-- Payment Requests
COPY payment_requests TO STDOUT WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\') \g '/tmp/payment_requests.csv'

-- Chat Messages
COPY chat_messages TO STDOUT WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\') \g '/tmp/chat_messages.csv'

-- Notifications
COPY notifications TO STDOUT WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\') \g '/tmp/notifications.csv'

-- Support Tickets
COPY support_tickets TO STDOUT WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\') \g '/tmp/support_tickets.csv'

-- Conversations
COPY conversations TO STDOUT WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\') \g '/tmp/conversations.csv'

-- Messages
COPY messages TO STDOUT WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\') \g '/tmp/messages.csv'

-- Admin Logs
COPY admin_logs TO STDOUT WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\') \g '/tmp/admin_logs.csv'

-- System Logs
COPY system_logs TO STDOUT WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\') \g '/tmp/system_logs.csv'

-- System Settings
COPY system_settings TO STDOUT WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\') \g '/tmp/system_settings.csv'

-- API Configurations
COPY api_configurations TO STDOUT WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\') \g '/tmp/api_configurations.csv'
