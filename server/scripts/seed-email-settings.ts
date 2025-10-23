/**
 * Seed email settings with Zoho SMTP credentials
 * Run this script once to initialize email configuration
 */

import { storage } from '../storage';

async function seedEmailSettings() {
  console.log('🌱 Seeding email settings...');

  try {
    // SMTP Server Settings
    await storage.setSystemSetting({
      category: 'email',
      key: 'smtp_host',
      value: 'smtp.zoho.com',
      description: 'SMTP server hostname'
    });

    await storage.setSystemSetting({
      category: 'email',
      key: 'smtp_port',
      value: '465',
      description: 'SMTP server port'
    });

    await storage.setSystemSetting({
      category: 'email',
      key: 'smtp_secure',
      value: 'true',
      description: 'Use SSL/TLS for SMTP'
    });

    await storage.setSystemSetting({
      category: 'email',
      key: 'smtp_username',
      value: 'support@greenpay.world',
      description: 'SMTP username'
    });

    await storage.setSystemSetting({
      category: 'email',
      key: 'smtp_password',
      value: 'Kitondosch.6639',
      description: 'SMTP password'
    });

    await storage.setSystemSetting({
      category: 'email',
      key: 'from_email',
      value: 'support@greenpay.world',
      description: 'From email address'
    });

    await storage.setSystemSetting({
      category: 'email',
      key: 'from_name',
      value: 'GreenPay',
      description: 'From name'
    });

    console.log('✅ Email settings seeded successfully!');
    console.log('');
    console.log('📧 Email Configuration:');
    console.log('  SMTP Host: smtp.zoho.com');
    console.log('  SMTP Port: 465 (SSL)');
    console.log('  Username: support@greenpay.world');
    console.log('  From: GreenPay <support@greenpay.world>');
    console.log('');
    console.log('You can now send emails via the email service!');
    
  } catch (error) {
    console.error('❌ Error seeding email settings:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the seeder
seedEmailSettings();
