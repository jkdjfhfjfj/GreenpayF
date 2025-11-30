import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft, Shield, Lock, Eye, Users, Bell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  const [, setLocation] = useLocation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4">
      <motion.div
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header with Hero */}
        <motion.div variants={itemVariants} className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/login")}
            className="rounded-full hover:bg-emerald-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Your data, your control
            </p>
          </div>
        </motion.div>

        {/* Last Updated */}
        <motion.p
          variants={itemVariants}
          className="text-sm text-slate-600 dark:text-slate-400 mb-8"
        >
          Last updated: November 30, 2025
        </motion.p>

        {/* Quick Links */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {[
            { icon: Shield, label: "Data Security", color: "from-emerald-500" },
            { icon: Lock, label: "Encryption", color: "from-blue-500" },
            { icon: Eye, label: "Privacy Controls", color: "from-purple-500" },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              className={`bg-gradient-to-br ${item.color} to-slate-100 dark:to-slate-800 rounded-lg p-4 shadow-md`}
            >
              <item.icon className="w-8 h-8 text-slate-900 dark:text-white mb-2" />
              <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-8 md:p-12 space-y-8 border border-emerald-100 dark:border-slate-700"
        >
          <motion.section variants={itemVariants}>
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  1. Information We Collect
                </h2>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We collect information necessary to provide our fintech services, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4 mt-3">
              <li><strong>Identity Information:</strong> Name, email, phone number, date of birth</li>
              <li><strong>Financial Information:</strong> Bank account details, card information, transaction history</li>
              <li><strong>Identity Verification:</strong> Government ID, passport, proof of residence</li>
              <li><strong>Biometric Data:</strong> Fingerprints and facial recognition for WebAuthn authentication</li>
              <li><strong>Device Information:</strong> IP address, device type, browser type, operating system</li>
              <li><strong>Usage Data:</strong> Features used, pages visited, transaction patterns</li>
            </ul>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="flex items-start gap-3 mb-4">
              <Lock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  2. How We Use Your Information
                </h2>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              We use your information to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>Process and facilitate financial transactions</li>
              <li>Verify your identity and comply with KYC regulations</li>
              <li>Provide secure authentication through biometric login</li>
              <li>Detect and prevent fraud and illegal activities</li>
              <li>Send important account and transaction notifications</li>
              <li>Improve our services and user experience</li>
              <li>Comply with legal and regulatory requirements</li>
              <li>Provide customer support</li>
            </ul>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="flex items-start gap-3 mb-4">
              <Users className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  3. Data Sharing and Third Parties
                </h2>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              We share your data with trusted third parties only when necessary:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li><strong>Payment Processors:</strong> Stripe and other payment gateways for transaction processing</li>
              <li><strong>WhatsApp Business:</strong> For customer communication and support</li>
              <li><strong>Email Service:</strong> Mailtrap for notification delivery</li>
              <li><strong>Media Storage:</strong> Cloudinary for secure document storage</li>
              <li><strong>Regulatory Bodies:</strong> As required by law and compliance obligations</li>
              <li><strong>Law Enforcement:</strong> When legally required or to prevent illegal activities</li>
            </ul>
            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm text-emerald-900 dark:text-emerald-100">
                <strong>Note:</strong> We never sell your personal data to advertisers or marketing companies.
              </p>
            </div>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="flex items-start gap-3 mb-4">
              <Lock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  4. Data Security
                </h2>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              We implement industry-leading security measures to protect your data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li><strong>End-to-End Encryption:</strong> All data transmitted using TLS/SSL encryption</li>
              <li><strong>Two-Factor Authentication:</strong> Protect your account with 2FA and backup codes</li>
              <li><strong>Biometric Security:</strong> WebAuthn standard for secure device authentication</li>
              <li><strong>Regular Audits:</strong> Continuous security testing and vulnerability assessments</li>
              <li><strong>Access Controls:</strong> Strict permissions limiting employee access to sensitive data</li>
              <li><strong>Data Minimization:</strong> We only collect data necessary for our services</li>
              <li><strong>Secure Storage:</strong> Database encryption and secure backup procedures</li>
            </ul>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="flex items-start gap-3 mb-4">
              <Eye className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  5. Your Privacy Rights
                </h2>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li><strong>Access:</strong> Request a copy of all personal data we hold about you</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request erasure of your data subject to legal requirements</li>
              <li><strong>Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Restrict Processing:</strong> Limit how we use your information</li>
              <li><strong>Object:</strong> Opt-out of marketing communications</li>
              <li><strong>Withdraw Consent:</strong> Revoke permissions you've granted us</li>
            </ul>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-3">
              To exercise these rights, contact us using the information in the "Contact Us" section.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="flex items-start gap-3 mb-4">
              <Bell className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  6. Biometric Data and WebAuthn
                </h2>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              When you enable biometric login through WebAuthn, we securely store your biometric credential ID on our servers. Your actual biometric data (fingerprint/face) never leaves your device. The biometric template is processed locally by your device's secure enclave, and only the credential ID is transmitted for authentication verification. You can disable biometric login at any time in your settings, which will delete all stored credential data.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="flex items-start gap-3 mb-4">
              <Trash2 className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  7. Data Retention
                </h2>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We retain your personal data only as long as necessary to provide our services and comply with legal requirements. Transaction records are retained for a minimum of 7 years per financial regulations. You can request deletion of non-essential data anytime through your account settings. Upon account deletion, we securely dispose of your data, except where we're legally required to retain it.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  8. Cookies and Tracking
                </h2>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We use essential cookies to maintain your session and provide security features. We do not use tracking cookies for advertising purposes. You can manage cookie preferences in your browser settings. Disabling cookies may limit certain features of our application.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="flex items-start gap-3 mb-4">
              <Users className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  9. Children's Privacy
                </h2>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              GreenPay is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will delete such information immediately and terminate the child's account.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="flex items-start gap-3 mb-4">
              <Lock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  10. Policy Updates
                </h2>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We may update this Privacy Policy periodically to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes via email or through a prominent notice on our platform. Your continued use of GreenPay following such notification constitutes your acceptance of the updated Privacy Policy.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
              <Users className="w-6 h-6 text-purple-600" />
              11. Contact Us
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              If you have questions about our Privacy Policy or your data, please contact us:
            </p>
            <div className="space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <p>📧 Email: privacy@greenpay.com</p>
              <p>💬 WhatsApp: Available through the Application</p>
              <p>🔗 Support Page: /support</p>
            </div>
          </motion.section>

          {/* Related Links */}
          <motion.section variants={itemVariants} className="pt-8 border-t border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Also review our Terms and Conditions:
            </p>
            <Button
              variant="outline"
              onClick={() => setLocation("/terms")}
              className="border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold"
            >
              View Terms and Conditions
            </Button>
          </motion.section>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="mt-8 flex justify-center gap-4 flex-wrap">
          <Button
            onClick={() => setLocation("/login")}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8"
          >
            Back to Login
          </Button>
          <Button
            onClick={() => setLocation("/terms")}
            variant="outline"
            className="border-emerald-200 dark:border-emerald-800"
          >
            Terms and Conditions
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
