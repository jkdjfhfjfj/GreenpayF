/**
 * GreenPay Email Templates
 * Beautiful, responsive HTML email templates with branding
 */

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GreenPay</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      width: 60px;
      height: 60px;
      background-color: #ffffff;
      border-radius: 50%;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: bold;
      color: #10b981;
    }
    .header-title {
      color: #ffffff;
      font-size: 24px;
      font-weight: bold;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .text {
      font-size: 16px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .otp-box {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 30px 0;
    }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      color: #ffffff;
      letter-spacing: 8px;
      margin: 0;
    }
    .otp-label {
      color: #ffffff;
      font-size: 14px;
      margin-top: 12px;
      opacity: 0.9;
    }
    .info-box {
      background-color: #f0fdf4;
      border-left: 4px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .warning-box {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .transaction-box {
      background-color: #f9fafb;
      border-radius: 12px;
      padding: 24px;
      margin: 20px 0;
    }
    .transaction-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .transaction-row:last-child {
      border-bottom: none;
    }
    .transaction-label {
      color: #6b7280;
      font-size: 14px;
    }
    .transaction-value {
      color: #1f2937;
      font-weight: 600;
      font-size: 14px;
    }
    .amount {
      font-size: 32px;
      font-weight: bold;
      color: #10b981;
      text-align: center;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff !important;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      text-align: center;
      margin: 20px 0;
    }
    .button-secondary {
      display: inline-block;
      background-color: #f3f4f6;
      color: #1f2937 !important;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      margin: 10px 5px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px 20px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
      margin: 8px 0;
    }
    .footer-links {
      margin: 20px 0;
    }
    .footer-link {
      color: #10b981;
      text-decoration: none;
      margin: 0 10px;
      font-size: 14px;
    }
    .social-icons {
      margin: 20px 0;
    }
    .social-icon {
      display: inline-block;
      width: 36px;
      height: 36px;
      background-color: #10b981;
      border-radius: 50%;
      margin: 0 8px;
      color: #ffffff;
      text-decoration: none;
      line-height: 36px;
      font-size: 18px;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .otp-code {
        font-size: 28px;
        letter-spacing: 6px;
      }
      .amount {
        font-size: 28px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <div class="logo">$</div>
      <h1 class="header-title">GreenPay</h1>
    </div>
    ${content}
    <div class="footer">
      <p class="footer-text"><strong>GreenPay</strong></p>
      <p class="footer-text">Send money to Africa safely, quickly, and affordably</p>
      
      <div class="footer-links">
        <a href="https://greenpay.world/help" class="footer-link">Help Center</a>
        <a href="https://greenpay.world/security" class="footer-link">Security</a>
        <a href="https://greenpay.world/contact" class="footer-link">Contact Us</a>
      </div>
      
      <div class="divider"></div>
      
      <p class="footer-text">This email was sent from GreenPay. Please do not reply to this email.</p>
      <p class="footer-text">If you didn't request this email, please contact our support team.</p>
      
      <p class="footer-text" style="margin-top: 20px;">
        © ${new Date().getFullYear()} GreenPay. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates = {
  /**
   * OTP Verification Email
   */
  otp: (otpCode: string, userName?: string) => {
    const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ''}! 👋</p>
        
        <p class="text">
          We received a request to verify your GreenPay account. Use the verification code below to complete the process.
        </p>
        
        <div class="otp-box">
          <p class="otp-code">${otpCode}</p>
          <p class="otp-label">Enter this code to verify your account</p>
        </div>
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            <strong>⏰ This code expires in 10 minutes</strong><br>
            For your security, do not share this code with anyone.
          </p>
        </div>
        
        <p class="text">
          If you didn't request this code, please ignore this email or contact our support team if you have concerns.
        </p>
      </div>
    `;
    return baseTemplate(content);
  },

  /**
   * Password Reset Email
   */
  passwordReset: (resetCode: string, userName?: string) => {
    const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ''}! 🔐</p>
        
        <p class="text">
          We received a request to reset your GreenPay account password. Use the code below to create a new password.
        </p>
        
        <div class="otp-box">
          <p class="otp-code">${resetCode}</p>
          <p class="otp-label">Password Reset Code</p>
        </div>
        
        <div class="warning-box">
          <p class="text" style="margin: 0;">
            <strong>⚠️ Security Alert</strong><br>
            This code expires in 10 minutes. If you didn't request a password reset, please secure your account immediately by contacting our support team.
          </p>
        </div>
        
        <p class="text">
          After entering this code, you'll be able to create a new secure password for your account.
        </p>
      </div>
    `;
    return baseTemplate(content);
  },

  /**
   * Welcome Email
   */
  welcome: (userName: string) => {
    const content = `
      <div class="content">
        <p class="greeting">Welcome to GreenPay, ${userName}! 🎉</p>
        
        <p class="text">
          We're thrilled to have you join our community! GreenPay makes sending money to Africa simple, secure, and affordable.
        </p>
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            <strong>🚀 Get Started:</strong><br>
            • Complete your profile verification<br>
            • Add funds to your account<br>
            • Send money to friends and family<br>
            • Get your virtual card for online payments
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/dashboard" class="button">Go to Dashboard</a>
        </div>
        
        <p class="text">
          Need help? Our support team is available 24/7 to assist you with any questions.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://greenpay.world/help" class="button-secondary">Visit Help Center</a>
          <a href="https://greenpay.world/contact" class="button-secondary">Contact Support</a>
        </div>
      </div>
    `;
    return baseTemplate(content);
  },

  /**
   * Fund Receipt Email
   */
  fundReceipt: (amount: string, currency: string, sender: string, userName?: string) => {
    const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ''}! 💰</p>
        
        <p class="text">
          Great news! You've received money in your GreenPay account.
        </p>
        
        <div class="amount">${currency} ${amount}</div>
        
        <div class="transaction-box">
          <div class="transaction-row">
            <span class="transaction-label">From</span>
            <span class="transaction-value">${sender}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Amount</span>
            <span class="transaction-value">${currency} ${amount}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Status</span>
            <span class="transaction-value" style="color: #10b981;">✓ Completed</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Date</span>
            <span class="transaction-value">${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/transactions" class="button">View Transaction Details</a>
        </div>
        
        <p class="text">
          Your new balance is now available in your account and ready to use.
        </p>
      </div>
    `;
    return baseTemplate(content);
  },

  /**
   * Transaction Notification Email
   */
  transaction: (
    type: string, 
    amount: string, 
    currency: string, 
    status: string,
    transactionId: string,
    userName?: string
  ) => {
    const action = type === 'withdraw' ? 'Withdrawal' : type === 'send' ? 'Transfer' : 'Transaction';
    const statusColor = status === 'completed' ? '#10b981' : status === 'pending' ? '#f59e0b' : '#ef4444';
    const statusIcon = status === 'completed' ? '✓' : status === 'pending' ? '⏳' : '✗';
    
    const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ''}!</p>
        
        <p class="text">
          Your ${action.toLowerCase()} has been ${status}.
        </p>
        
        <div class="amount">${currency} ${amount}</div>
        
        <div class="transaction-box">
          <div class="transaction-row">
            <span class="transaction-label">Type</span>
            <span class="transaction-value">${action}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Amount</span>
            <span class="transaction-value">${currency} ${amount}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Status</span>
            <span class="transaction-value" style="color: ${statusColor};">${statusIcon} ${status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Transaction ID</span>
            <span class="transaction-value">${transactionId}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Date</span>
            <span class="transaction-value">${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/transactions" class="button">View All Transactions</a>
        </div>
      </div>
    `;
    return baseTemplate(content);
  },

  /**
   * Login Alert Email
   */
  loginAlert: (location: string, ip: string, timestamp: string, userName?: string) => {
    const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ''}! 🔐</p>
        
        <p class="text">
          We detected a new login to your GreenPay account. If this was you, you can safely ignore this email.
        </p>
        
        <div class="transaction-box">
          <div class="transaction-row">
            <span class="transaction-label">Location</span>
            <span class="transaction-value">${location}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">IP Address</span>
            <span class="transaction-value">${ip}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Time</span>
            <span class="transaction-value">${timestamp}</span>
          </div>
        </div>
        
        <div class="warning-box">
          <p class="text" style="margin: 0;">
            <strong>⚠️ Was this you?</strong><br>
            If you don't recognize this login activity, please secure your account immediately by changing your password and enabling two-factor authentication.
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/settings/security" class="button">Secure My Account</a>
        </div>
        
        <p class="text">
          For your security, we recommend using strong, unique passwords and enabling two-factor authentication.
        </p>
      </div>
    `;
    return baseTemplate(content);
  },

  /**
   * KYC Verified Email
   */
  kycVerified: (userName: string) => {
    const content = `
      <div class="content">
        <p class="greeting">Congratulations, ${userName}! ✅</p>
        
        <p class="text">
          Your GreenPay account has been successfully verified! You now have full access to all our features.
        </p>
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            <strong>🎉 What's now available:</strong><br>
            • Send money internationally without limits<br>
            • Request and receive payments<br>
            • Order virtual cards for online shopping<br>
            • Access premium features and lower fees
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/dashboard" class="button">Explore Your Account</a>
        </div>
        
        <p class="text">
          Thank you for completing the verification process. We're excited to help you with all your money transfer needs!
        </p>
      </div>
    `;
    return baseTemplate(content);
  },

  /**
   * Card Activation Email
   */
  cardActivation: (cardLastFour: string, userName?: string) => {
    const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ''}! 💳</p>
        
        <p class="text">
          Great news! Your GreenPay virtual card is now active and ready to use.
        </p>
        
        <div class="transaction-box">
          <div style="text-align: center; padding: 20px 0;">
            <div style="font-size: 48px; margin-bottom: 12px;">💳</div>
            <p class="transaction-value" style="font-size: 18px;">Card ending in •••• ${cardLastFour}</p>
            <p class="transaction-label">Status: <span style="color: #10b981; font-weight: 600;">Active</span></p>
          </div>
        </div>
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            <strong>🛡️ Security Tips:</strong><br>
            • Never share your card details with anyone<br>
            • Enable transaction notifications<br>
            • Set spending limits for extra security<br>
            • Review transactions regularly
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/cards" class="button">View Card Details</a>
        </div>
        
        <p class="text">
          Your card can be used for online purchases anywhere that accepts virtual cards. Happy shopping!
        </p>
      </div>
    `;
    return baseTemplate(content);
  },

  /**
   * Test Email
   */
  test: () => {
    const content = `
      <div class="content">
        <p class="greeting">Email Configuration Test ✅</p>
        
        <p class="text">
          This is a test email to verify that your GreenPay email configuration is working correctly.
        </p>
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            <strong>✓ Success!</strong><br>
            If you're reading this, your SMTP settings are configured correctly and emails are being sent successfully.
          </p>
        </div>
        
        <p class="text">
          Your email service is now ready to send notifications to your users for:
        </p>
        
        <ul class="text">
          <li>OTP verification codes</li>
          <li>Password reset requests</li>
          <li>Transaction notifications</li>
          <li>Login alerts</li>
          <li>Account updates</li>
        </ul>
        
        <p class="text">
          You can close this test email. Everything is working perfectly!
        </p>
      </div>
    `;
    return baseTemplate(content);
  },

  /**
   * Custom Admin Email
   */
  custom: (params: { 
    message: string; 
    imageUrl?: string; 
    linkText?: string; 
    linkUrl?: string;
  }) => {
    const formatMessage = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n• /g, '<br>• ')
        .replace(/\n/g, '<br>');
    };

    const imageSection = params.imageUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <img src="${params.imageUrl}" alt="Email Image" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      </div>
    ` : '';

    const linkSection = params.linkText && params.linkUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.linkUrl}" class="button" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          ${params.linkText}
        </a>
      </div>
    ` : '';

    const content = `
      <div class="content">
        <p class="greeting">Message from GreenPay Team</p>
        
        <p class="text">
          ${formatMessage(params.message)}
        </p>

        ${imageSection}
        ${linkSection}
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
        </div>
      </div>
    `;
    return baseTemplate(content);
  },
};
