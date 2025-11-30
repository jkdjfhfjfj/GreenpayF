import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft, ScrollText, BadgeCheck, AlertCircle, Lock, DollarSign, Shield, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsAndConditionsPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4">
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
            className="rounded-full hover:bg-blue-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Terms and Conditions
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Important legal information for using GreenPay
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
            { icon: Lock, label: "Your Rights", color: "from-blue-500" },
            { icon: DollarSign, label: "Payment Terms", color: "from-indigo-500" },
            { icon: Shield, label: "Security", color: "from-purple-500" },
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
          className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-8 md:p-12 space-y-8 border border-blue-100 dark:border-slate-700"
        >
          <motion.section variants={itemVariants}>
            <div className="flex items-start gap-3 mb-4">
              <BadgeCheck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  1. Acceptance of Terms
                </h2>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              By accessing and using GreenPay ("the Application"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="flex items-start gap-3 mb-4">
              <Lock className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  2. Use License
                </h2>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              Permission is granted to temporarily download one copy of the materials (information or software) on GreenPay for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on the Application</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
              <li>Violating any applicable laws or regulations</li>
            </ul>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              3. Disclaimer of Warranties
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              The materials on GreenPay are provided on an 'as is' basis. GreenPay makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights. Further, GreenPay does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its Internet web site or otherwise relating to such materials or on any sites linked to this site.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              4. Limitations of Liability
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              In no event shall GreenPay or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on GreenPay, even if GreenPay or an authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              5. Accuracy of Materials
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              The materials appearing on GreenPay could include technical, typographical, or photographic errors. GreenPay does not warrant that any of the materials on its Application are accurate, complete, or current. GreenPay may make changes to the materials contained on its Application at any time without notice.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              6. Materials on Other Sites
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              GreenPay has not reviewed all of the sites linked to its Application and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by GreenPay of the site. Use of any such linked website is at the user's own risk.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              7. Modifications of Terms
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              GreenPay may revise these terms of service for its Application at any time without notice. By using this Application, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              8. Governing Law
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which GreenPay operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              9. User Accounts and Passwords
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              When you create an account on GreenPay, you are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>Maintaining the confidentiality of your account information and password</li>
              <li>Restricting access to your computer or mobile device</li>
              <li>Accepting responsibility for all activities that occur under your account</li>
              <li>Notifying GreenPay immediately of any unauthorized use of your account</li>
            </ul>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              10. Payment and Financial Transactions
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              GreenPay facilitates financial transactions including money transfers, virtual card payments, currency exchange, and airtime purchases. By using these services, you:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>Acknowledge that all transactions are final and cannot be reversed</li>
              <li>Accept responsibility for verifying recipient details before confirming payments</li>
              <li>Understand that GreenPay acts as a facilitator and is not liable for third-party errors</li>
              <li>Agree to comply with all applicable laws and regulations regarding financial transactions</li>
              <li>Accept that transaction fees and exchange rates are clearly displayed before confirmation</li>
            </ul>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              11. Security and Privacy
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              GreenPay implements comprehensive security measures including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>Two-factor authentication and biometric login capabilities</li>
              <li>End-to-end encryption for sensitive data transmission</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Compliance with international data protection standards</li>
            </ul>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-3">
              Your use of biometric authentication and backup codes is governed by these terms. You are solely responsible for safeguarding your backup codes.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              12. Document Upload and Verification
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              When you upload documents for KYC verification, you represent and warrant that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>All documents are authentic and accurate</li>
              <li>You have the right to upload and share the documents</li>
              <li>The documents comply with all applicable privacy laws</li>
              <li>GreenPay may verify documents with third-party services</li>
            </ul>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              13. Third-Party Services
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              GreenPay integrates with third-party services including WhatsApp Business API, Cloudinary, Mailtrap, and payment processors. Your use of these services is subject to their respective terms and conditions. GreenPay is not responsible for any issues arising from third-party services.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              14. Prohibited Activities
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>Engage in any illegal or fraudulent activities</li>
              <li>Use the Application for money laundering or terrorism financing</li>
              <li>Attempt to gain unauthorized access to the Application or its systems</li>
              <li>Harass, threaten, or defame other users</li>
              <li>Upload malware, viruses, or malicious code</li>
              <li>Interfere with the normal operation of the Application</li>
            </ul>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              15. Limitation of Service
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              GreenPay reserves the right to limit, suspend, or terminate your account if you violate these terms, engage in suspicious activities, or pose a security risk. Termination may result in loss of access to funds and account data.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              16. Intellectual Property Rights
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              All content on the GreenPay Application, including logos, designs, text, and graphics, are the property of GreenPay or its content suppliers and are protected by international copyright laws. You may not reproduce, distribute, or transmit any content without prior written permission.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              17. Indemnification
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              You agree to indemnify, defend, and hold harmless GreenPay and its officers, directors, employees, and agents from any and all claims, damages, losses, costs, and expenses (including attorney's fees) arising from or related to your use of the Application or violation of these terms.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              18. Contact Information
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              If you have any questions about these Terms and Conditions, please contact us at:
            </p>
            <div className="mt-3 text-slate-700 dark:text-slate-300 space-y-1">
              <p>Email: support@greenpay.com</p>
              <p>WhatsApp: Available through the Application</p>
              <p>Support Page: /support</p>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              By continuing to use GreenPay, you agree to be bound by all terms and conditions outlined above. Thank you for using GreenPay!
            </p>
          </motion.section>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="mt-8 flex justify-center gap-4 flex-wrap">
          <Button
            onClick={() => setLocation("/login")}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8"
          >
            Back to Login
          </Button>
          <Button
            onClick={() => setLocation("/privacy")}
            variant="outline"
            className="border-blue-200 dark:border-blue-800"
          >
            Privacy Policy
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
