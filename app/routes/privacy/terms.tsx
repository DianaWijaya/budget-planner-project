import { Link } from "react-router";
import type { Route } from "./+types/terms";
import { theme, cn } from "~/lib/theme";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Terms of Service | Costally" },
    { name: "description", content: "Terms of Service for Costally - Personal Finance Tracker" },
  ];
}

export default function TermsPage() {
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
            <h1 className={cn(theme.typography.h1, "mb-4")}>Terms of Service</h1>
            <p className={theme.typography.bodySmall}>
              Last Updated: December 26, 2024
            </p>
          </div>

          {/* Content */}
          <div className={cn(theme.components.card.base, "prose prose-gray max-w-none")}>
            <div className={cn(theme.layout.card, "space-y-6")}>
              {/* Introduction */}
              <section>
                <h2 className={theme.typography.h3}>1. Acceptance of Terms</h2>
                <p className={theme.typography.body}>
                  By accessing and using Costally ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
                </p>
              </section>

              {/* Use of Service */}
              <section>
                <h2 className={theme.typography.h3}>2. Use of Service</h2>
                <p className={theme.typography.body}>
                  Costally is a personal finance tracking application that helps you manage your income, expenses, and budgets. You agree to use the Service only for lawful purposes and in accordance with these Terms.
                </p>
                <div className="ml-6 mt-3 space-y-2">
                  <p className={theme.typography.body}>You agree not to:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li className={theme.typography.body}>Use the Service for any illegal or unauthorized purpose</li>
                    <li className={theme.typography.body}>Attempt to gain unauthorized access to any part of the Service</li>
                    <li className={theme.typography.body}>Use the Service to transmit any malicious code or viruses</li>
                    <li className={theme.typography.body}>Interfere with or disrupt the Service or servers</li>
                    <li className={theme.typography.body}>Impersonate any person or entity</li>
                  </ul>
                </div>
              </section>

              {/* User Accounts */}
              <section>
                <h2 className={theme.typography.h3}>3. User Accounts</h2>
                <p className={theme.typography.body}>
                  To use certain features of the Service, you must create an account. You are responsible for:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-3">
                  <li className={theme.typography.body}>Maintaining the confidentiality of your account credentials</li>
                  <li className={theme.typography.body}>All activities that occur under your account</li>
                  <li className={theme.typography.body}>Notifying us immediately of any unauthorized use of your account</li>
                  <li className={theme.typography.body}>Ensuring that your account information is accurate and up-to-date</li>
                </ul>
              </section>

              {/* Data and Privacy */}
              <section>
                <h2 className={theme.typography.h3}>4. Your Financial Data</h2>
                <p className={theme.typography.body}>
                  You retain all rights to the financial data you input into the Service. By using Costally, you grant us permission to process and store your data to provide the Service. We take data security seriously and implement reasonable measures to protect your information.
                </p>
                <p className={theme.typography.body}>
                  For more information about how we collect and use your data, please see our <Link to="/privacy" className="text-brand-600 hover:text-brand-700 underline">Privacy Policy</Link>.
                </p>
              </section>

              {/* AI Features */}
              <section>
                <h2 className={theme.typography.h3}>5. AI-Powered Features</h2>
                <p className={theme.typography.body}>
                  Costally uses Google Gemini AI to provide personalized financial insights and advice through our chatbot feature. By using this feature:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-3">
                  <li className={theme.typography.body}>You acknowledge that AI-generated advice is for informational purposes only</li>
                  <li className={theme.typography.body}>You understand that AI suggestions should not be considered professional financial advice</li>
                  <li className={theme.typography.body}>You agree to consult with qualified financial professionals for important financial decisions</li>
                  <li className={theme.typography.body}>We are not responsible for decisions made based on AI-generated recommendations</li>
                </ul>
              </section>

              {/* Disclaimer */}
              <section>
                <h2 className={theme.typography.h3}>6. Disclaimer of Warranties</h2>
                <p className={theme.typography.body}>
                  The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the Service will be uninterrupted, secure, or error-free. Costally is a tool to help you track your finances, but we are not responsible for any financial decisions you make.
                </p>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h2 className={theme.typography.h3}>7. Limitation of Liability</h2>
                <p className={theme.typography.body}>
                  To the maximum extent permitted by law, Costally and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
                </p>
                <ul className="list-disc ml-6 space-y-1 mt-3">
                  <li className={theme.typography.body}>Your use or inability to use the Service</li>
                  <li className={theme.typography.body}>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
                  <li className={theme.typography.body}>Any bugs, viruses, or other harmful code that may be transmitted through the Service</li>
                  <li className={theme.typography.body}>Financial decisions made based on information provided by the Service</li>
                </ul>
              </section>

              {/* Modifications */}
              <section>
                <h2 className={theme.typography.h3}>8. Modifications to Service</h2>
                <p className={theme.typography.body}>
                  We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
                </p>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className={theme.typography.h3}>9. Changes to Terms</h2>
                <p className={theme.typography.body}>
                  We may update these Terms of Service from time to time. We will notify you of any changes by posting the new Terms on this page and updating the "Last Updated" date. Your continued use of the Service after such changes constitutes your acceptance of the new Terms.
                </p>
              </section>

              {/* Termination */}
              <section>
                <h2 className={theme.typography.h3}>10. Termination</h2>
                <p className={theme.typography.body}>
                  We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will cease immediately.
                </p>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className={theme.typography.h3}>11. Governing Law</h2>
                <p className={theme.typography.body}>
                  These Terms shall be governed by and construed in accordance with the laws of your jurisdiction, without regard to its conflict of law provisions.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className={theme.typography.h3}>12. Contact Information</h2>
                <p className={theme.typography.body}>
                  If you have any questions about these Terms of Service, please contact us through our GitHub repository or by opening an issue at:
                </p>
                <p className={cn(theme.typography.body, "mt-2")}>
                  <a 
                    href="https://github.com/DianaWijaya/budget-planner-project/issues" 
                    className="text-brand-600 hover:text-brand-700 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    github.com/DianaWijaya/budget-planner-project
                  </a>
                </p>
              </section>

              {/* Agreement */}
              <section className="border-t border-gray-200 pt-6 mt-6">
                <p className={cn(theme.typography.body, "font-semibold")}>
                  By using Costally, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
            <Link to="/terms" className={cn(theme.typography.bodyTiny, "text-brand-600 font-medium")}>
              Terms
            </Link>
            <Link to="/privacy" className={cn(theme.typography.bodyTiny, "hover:text-brand-600")}>
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