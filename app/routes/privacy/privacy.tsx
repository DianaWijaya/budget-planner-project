import { Link } from "react-router";
import type { Route } from "./+types/privacy";
import { theme, cn } from "~/lib/theme";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Privacy Policy | Costally" },
    { name: "description", content: "Privacy Policy for Costally - Personal Finance Tracker" },
  ];
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className={theme.layout.container}>
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img 
                src="/logo.png" 
                alt="Costally Logo" 
                className="h-10 w-10 object-contain"
              />
              <span className={cn(theme.typography.h4, "text-brand-600")}>
                Costally
              </span>
            </Link>
            <Link
              to="/"
              className={cn(theme.typography.bodySmall, "font-medium text-gray-700 hover:text-brand-600")}
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={cn(theme.layout.container, "py-12")}>
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className={cn(theme.typography.h1, "mb-4")}>Privacy Policy</h1>
            <p className={theme.typography.bodySmall}>
              Last Updated: December 26, 2024
            </p>
          </div>

          {/* Content */}
          <div className={cn(theme.components.card.base, "prose prose-gray max-w-none")}>
            <div className={cn(theme.layout.card, "space-y-6")}>
              {/* Introduction */}
              <section>
                <h2 className={theme.typography.h3}>1. Introduction</h2>
                <p className={theme.typography.body}>
                  Welcome to Costally. We respect your privacy and are committed to protecting your personal and financial data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our personal finance tracking application.
                </p>
                <p className={theme.typography.body}>
                  Please read this Privacy Policy carefully. By using Costally, you agree to the collection and use of information in accordance with this policy.
                </p>
              </section>

              {/* Information We Collect */}
              <section>
                <h2 className={theme.typography.h3}>2. Information We Collect</h2>
                
                <h3 className={cn(theme.typography.h4, "mt-4 mb-2")}>2.1 Personal Information</h3>
                <p className={theme.typography.body}>
                  When you create an account, we collect:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-2">
                  <li className={theme.typography.body}>Email address</li>
                  <li className={theme.typography.body}>Password (encrypted and hashed using bcrypt)</li>
                  <li className={theme.typography.body}>Account creation date</li>
                </ul>

                <h3 className={cn(theme.typography.h4, "mt-4 mb-2")}>2.2 Financial Data</h3>
                <p className={theme.typography.body}>
                  You voluntarily provide financial information to use our service, including:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-2">
                  <li className={theme.typography.body}>Income sources and amounts</li>
                  <li className={theme.typography.body}>Expense transactions and categories</li>
                  <li className={theme.typography.body}>Budget allocations and limits</li>
                  <li className={theme.typography.body}>Transaction descriptions and dates</li>
                  <li className={theme.typography.body}>Recurring transaction settings</li>
                </ul>

                <h3 className={cn(theme.typography.h4, "mt-4 mb-2")}>2.3 Usage Data</h3>
                <p className={theme.typography.body}>
                  We automatically collect certain information when you use Costally:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-2">
                  <li className={theme.typography.body}>Log data (IP address, browser type, pages visited)</li>
                  <li className={theme.typography.body}>Device information</li>
                  <li className={theme.typography.body}>Session data and timestamps</li>
                  <li className={theme.typography.body}>Feature usage patterns</li>
                </ul>

                <h3 className={cn(theme.typography.h4, "mt-4 mb-2")}>2.4 AI Chatbot Interactions</h3>
                <p className={theme.typography.body}>
                  When you use our AI-powered chatbot:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-2">
                  <li className={theme.typography.body}>Your questions and prompts are sent to Google Gemini AI</li>
                  <li className={theme.typography.body}>Your financial summary data is included for context</li>
                  <li className={theme.typography.body}>Conversations may be processed to improve the service</li>
                </ul>
              </section>

              {/* How We Use Your Information */}
              <section>
                <h2 className={theme.typography.h3}>3. How We Use Your Information</h2>
                <p className={theme.typography.body}>
                  We use the collected information for the following purposes:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-3">
                  <li className={theme.typography.body}><strong>To provide our service:</strong> Track your income, expenses, and budgets</li>
                  <li className={theme.typography.body}><strong>To personalize your experience:</strong> Generate AI-powered financial insights based on your data</li>
                  <li className={theme.typography.body}><strong>To maintain security:</strong> Protect your account and prevent unauthorized access</li>
                  <li className={theme.typography.body}><strong>To improve our service:</strong> Analyze usage patterns to enhance features</li>
                  <li className={theme.typography.body}><strong>To communicate with you:</strong> Send important updates about the service</li>
                  <li className={theme.typography.body}><strong>To comply with legal obligations:</strong> When required by law</li>
                </ul>
              </section>

              {/* Data Storage and Security */}
              <section>
                <h2 className={theme.typography.h3}>4. Data Storage and Security</h2>
                
                <h3 className={cn(theme.typography.h4, "mt-4 mb-2")}>4.1 How We Store Your Data</h3>
                <p className={theme.typography.body}>
                  Your data is stored in a PostgreSQL database with the following security measures:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-2">
                  <li className={theme.typography.body}>Passwords are hashed using bcrypt (never stored in plain text)</li>
                  <li className={theme.typography.body}>Data is encrypted in transit using HTTPS/SSL</li>
                  <li className={theme.typography.body}>Database access is restricted and authenticated</li>
                  <li className={theme.typography.body}>Regular security updates and patches</li>
                </ul>

                <h3 className={cn(theme.typography.h4, "mt-4 mb-2")}>4.2 Third-Party Services</h3>
                <p className={theme.typography.body}>
                  We use the following third-party services:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-2">
                  <li className={theme.typography.body}><strong>Google Gemini AI:</strong> Processes your financial data to provide personalized advice</li>
                  <li className={theme.typography.body}><strong>Vercel:</strong> Hosts our application</li>
                  <li className={theme.typography.body}><strong>PostgreSQL Provider:</strong> Stores your data securely</li>
                </ul>
                <p className={cn(theme.typography.body, "mt-2")}>
                  These services have their own privacy policies governing their use of your information.
                </p>
              </section>

              {/* Data Sharing */}
              <section>
                <h2 className={theme.typography.h3}>5. Data Sharing and Disclosure</h2>
                <p className={theme.typography.body}>
                  We do NOT sell, trade, or rent your personal or financial information to third parties. We may share your information only in the following circumstances:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-3">
                  <li className={theme.typography.body}><strong>With your consent:</strong> When you explicitly authorize us to share specific information</li>
                  <li className={theme.typography.body}><strong>Service providers:</strong> With trusted third parties who help us operate our service (e.g., Google Gemini AI)</li>
                  <li className={theme.typography.body}><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
                  <li className={theme.typography.body}><strong>Business transfers:</strong> In the event of a merger or acquisition (you will be notified)</li>
                </ul>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className={theme.typography.h3}>6. Your Privacy Rights</h2>
                <p className={theme.typography.body}>
                  You have the following rights regarding your personal data:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-3">
                  <li className={theme.typography.body}><strong>Access:</strong> Request a copy of your personal data</li>
                  <li className={theme.typography.body}><strong>Correction:</strong> Update or correct your information through your account settings</li>
                  <li className={theme.typography.body}><strong>Deletion:</strong> Request deletion of your account and all associated data</li>
                  <li className={theme.typography.body}><strong>Export:</strong> Download your financial data in a portable format</li>
                  <li className={theme.typography.body}><strong>Opt-out:</strong> Disable AI features if you prefer not to use them</li>
                </ul>
                <p className={cn(theme.typography.body, "mt-3")}>
                  To exercise these rights, please contact us through GitHub or delete your account through the application settings.
                </p>
              </section>

              {/* Data Retention */}
              <section>
                <h2 className={theme.typography.h3}>7. Data Retention</h2>
                <p className={theme.typography.body}>
                  We retain your data for as long as your account is active. If you delete your account:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-2">
                  <li className={theme.typography.body}>All your personal and financial data will be permanently deleted from our databases</li>
                  <li className={theme.typography.body}>Deletion may take up to 30 days to complete</li>
                  <li className={theme.typography.body}>Some anonymized usage statistics may be retained for analytics</li>
                  <li className={theme.typography.body}>Legal obligations may require us to retain certain information</li>
                </ul>
              </section>

              {/* Cookies */}
              <section>
                <h2 className={theme.typography.h3}>8. Cookies and Tracking</h2>
                <p className={theme.typography.body}>
                  We use cookies and similar tracking technologies to:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-2">
                  <li className={theme.typography.body}>Maintain your login session</li>
                  <li className={theme.typography.body}>Remember your preferences</li>
                  <li className={theme.typography.body}>Analyze how you use our service</li>
                </ul>
                <p className={cn(theme.typography.body, "mt-3")}>
                  You can control cookies through your browser settings, but disabling cookies may limit some functionality.
                </p>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className={theme.typography.h3}>9. Children's Privacy</h2>
                <p className={theme.typography.body}>
                  Costally is not intended for use by children under the age of 13. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us, and we will delete such information.
                </p>
              </section>

              {/* International Users */}
              <section>
                <h2 className={theme.typography.h3}>10. International Data Transfers</h2>
                <p className={theme.typography.body}>
                  Your information may be transferred to and processed in countries other than your own. These countries may have different data protection laws. By using Costally, you consent to the transfer of your information to these countries.
                </p>
              </section>

              {/* Changes to Privacy Policy */}
              <section>
                <h2 className={theme.typography.h3}>11. Changes to This Privacy Policy</h2>
                <p className={theme.typography.body}>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-2">
                  <li className={theme.typography.body}>Posting the new Privacy Policy on this page</li>
                  <li className={theme.typography.body}>Updating the "Last Updated" date</li>
                  <li className={theme.typography.body}>Sending you an email notification (for significant changes)</li>
                </ul>
                <p className={cn(theme.typography.body, "mt-3")}>
                  Your continued use of Costally after any changes constitutes your acceptance of the new Privacy Policy.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className={theme.typography.h3}>12. Contact Us</h2>
                <p className={theme.typography.body}>
                  If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact us:
                </p>
                <div className="mt-3 space-y-2">
                  <p className={theme.typography.body}>
                    <strong>GitHub:</strong>{' '}
                    <a 
                      href="https://github.com/DianaWijaya/budget-planner-project/issues" 
                      className="text-brand-600 hover:text-brand-700 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      github.com/DianaWijaya/budget-planner-project
                    </a>
                  </p>
                  <p className={theme.typography.body}>
                    <strong>Project:</strong> Costally - Personal Finance Tracker
                  </p>
                </div>
              </section>

              {/* GDPR & CCPA Compliance */}
              <section>
                <h2 className={theme.typography.h3}>13. Legal Compliance</h2>
                <p className={theme.typography.body}>
                  We are committed to complying with applicable data protection laws, including:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-2">
                  <li className={theme.typography.body}><strong>GDPR</strong> (General Data Protection Regulation) for European users</li>
                  <li className={theme.typography.body}><strong>CCPA</strong> (California Consumer Privacy Act) for California residents</li>
                  <li className={theme.typography.body}>Other applicable regional privacy laws</li>
                </ul>
                <p className={cn(theme.typography.body, "mt-3")}>
                  If you are a resident of the European Economic Area or California, you have additional rights under these laws. Please contact us to exercise these rights.
                </p>
              </section>

              {/* Agreement */}
              <section className="border-t border-gray-200 pt-6 mt-6">
                <p className={cn(theme.typography.body, "font-semibold")}>
                  By using Costally, you acknowledge that you have read, understood, and agree to this Privacy Policy.
                </p>
              </section>
            </div>
          </div>

          {/* Back to Home Button */}
          <div className="mt-8 text-center">
            <Link to="/" className={theme.components.button.primary}>
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 mt-12">
        <div className={cn(theme.layout.container, "text-center")}>
          <div className="flex items-center justify-center gap-6">
            <Link to="/terms" className={cn(theme.typography.bodyTiny, "hover:text-brand-600")}>
              Terms
            </Link>
            <Link to="/privacy" className={cn(theme.typography.bodyTiny, "text-brand-600 font-medium")}>
              Privacy
            </Link>
            <a 
              href="https://github.com/DianaWijaya/budget-planner-project" 
              className={cn(theme.typography.bodyTiny, "hover:text-brand-600")}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
          <p className={cn(theme.typography.bodyTiny, "mt-4")}>
            © {new Date().getFullYear()} Costally. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}