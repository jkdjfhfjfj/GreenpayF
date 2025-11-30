-- GreenPay Database Restore Script
-- This file restores all data to GreenPay database tables
-- Usage: psql -U postgres -d greenpay -f restore.sql

-- Disable foreign key checks during restore
SET session_replication_role = 'replica';

-- Clear existing data in reverse dependency order
TRUNCATE TABLE IF EXISTS api_configurations CASCADE;
TRUNCATE TABLE IF EXISTS system_settings CASCADE;
TRUNCATE TABLE IF EXISTS system_logs CASCADE;
TRUNCATE TABLE IF EXISTS admin_logs CASCADE;
TRUNCATE TABLE IF EXISTS messages CASCADE;
TRUNCATE TABLE IF EXISTS conversations CASCADE;
TRUNCATE TABLE IF EXISTS support_tickets CASCADE;
TRUNCATE TABLE IF EXISTS notifications CASCADE;
TRUNCATE TABLE IF EXISTS chat_messages CASCADE;
TRUNCATE TABLE IF EXISTS payment_requests CASCADE;
TRUNCATE TABLE IF EXISTS transactions CASCADE;
TRUNCATE TABLE IF EXISTS recipients CASCADE;
TRUNCATE TABLE IF EXISTS virtual_cards CASCADE;
TRUNCATE TABLE IF EXISTS kyc_documents CASCADE;
TRUNCATE TABLE IF EXISTS users CASCADE;
TRUNCATE TABLE IF EXISTS admins CASCADE;

-- Restore data from CSV files in dependency order
-- Note: Replace file paths with actual backup file locations

-- Restore Users
COPY users FROM '/tmp/users.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\');

-- Restore Admins
COPY admins FROM '/tmp/admins.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\');

-- Restore KYC Documents
COPY kyc_documents FROM '/tmp/kyc_documents.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\');

-- Restore Virtual Cards
COPY virtual_cards FROM '/tmp/virtual_cards.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\');

-- Restore Recipients
COPY recipients FROM '/tmp/recipients.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\');

-- Restore Transactions
COPY transactions FROM '/tmp/transactions.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\');

-- Restore Payment Requests
COPY payment_requests FROM '/tmp/payment_requests.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\');

-- Restore Chat Messages
COPY chat_messages FROM '/tmp/chat_messages.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\');

-- Restore Notifications
COPY notifications FROM '/tmp/notifications.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\');

-- Restore Support Tickets
COPY support_tickets FROM '/tmp/support_tickets.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\');

-- Restore Conversations
COPY conversations FROM '/tmp/conversations.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\');

-- Restore Messages
COPY messages FROM '/tmp/messages.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\');

-- Restore Admin Logs
COPY admin_logs FROM '/tmp/admin_logs.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\');

-- Restore System Logs
COPY system_logs FROM '/tmp/system_logs.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\');

-- Restore System Settings
COPY system_settings FROM '/tmp/system_settings.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\');

-- Restore API Configurations
COPY api_configurations FROM '/tmp/api_configurations.csv' WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '\');

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Verify restoration by showing table record counts
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'admins', COUNT(*) FROM admins
UNION ALL
SELECT 'kyc_documents', COUNT(*) FROM kyc_documents
UNION ALL
SELECT 'virtual_cards', COUNT(*) FROM virtual_cards
UNION ALL
SELECT 'recipients', COUNT(*) FROM recipients
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'payment_requests', COUNT(*) FROM payment_requests
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'support_tickets', COUNT(*) FROM support_tickets
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'admin_logs', COUNT(*) FROM admin_logs
UNION ALL
SELECT 'system_logs', COUNT(*) FROM system_logs
UNION ALL
SELECT 'system_settings', COUNT(*) FROM system_settings
UNION ALL
SELECT 'api_configurations', COUNT(*) FROM api_configurations
ORDER BY table_name;
