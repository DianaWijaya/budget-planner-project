import { Link } from "react-router";
import type { Route } from "./+types/home";
import { theme, cn } from "~/lib/theme";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Costally | Take Control of Your Finances" },
    { name: "description", content: "Simple, powerful tracking for your income and expenses. Start managing your budget today." },
  ];
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className={cn(theme.layout.container, "flex h-16 items-center justify-between")}>
          <div className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="Costally Logo" 
              className="h-20 w-20 object-contain"
            />
            <span className={cn(theme.typography.h4, "text-brand-600")}>
              Costally
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={cn(theme.typography.bodySmall, "font-medium text-gray-700 hover:text-brand-600")}
            >
              Log In
            </Link>
            <Link to="/signup" className={theme.components.button.primary}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-brand-600 animate-pulse"></span>
            <span className={cn(theme.typography.bodySmall, "font-medium text-brand-700")}>
              Free expense tracking & budgeting tool
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Take Control of Your{" "}
            <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              Finances
            </span>
          </h1>

          {/* Subheading */}
          <p className={cn(theme.typography.body, "mx-auto mb-12 max-w-2xl text-xl text-gray-600")}>
            Simple, powerful tracking for your income and expenses. 
            Make better financial decisions with clear insights and easy budgeting.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/signup"
              className={cn(
                theme.components.button.primary,
                "group px-8 py-4 text-base"
              )}
            >
              Start Today
              <svg 
                className="ml-2 inline-block h-5 w-5 transition-transform group-hover:translate-x-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/login"
              className={cn(
                theme.components.button.outline,
                "px-8 py-4 text-base"
              )}
            >
              Sign In
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Secure & Private
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Fast & Simple
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Free
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="border-t border-gray-200 bg-white py-16">
        <div className={theme.layout.container}>
          <h2 className={cn(theme.typography.h2, "mb-12 text-center")}>
            Everything you need to manage your money
          </h2>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className={cn(theme.components.card.hover, "text-center")}>
              <div className={theme.layout.card}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className={cn(theme.typography.h4, "mb-2")}>Track Income</h3>
                <p className={theme.typography.bodySmall}>
                  Record all your income sources and see where your money comes from.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className={cn(theme.components.card.hover, "text-center")}>
              <div className={theme.layout.card}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
                <h3 className={cn(theme.typography.h4, "mb-2")}>Monitor Expenses</h3>
                <p className={theme.typography.bodySmall}>
                  Categorize and track every expense to understand your spending habits.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className={cn(theme.components.card.hover, "text-center")}>
              <div className={theme.layout.card}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className={cn(theme.typography.h4, "mb-2")}>Set Budgets</h3>
                <p className={theme.typography.bodySmall}>
                  Create monthly budgets and get alerts when you're close to limits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className={cn(theme.layout.container, "text-center")}>
          <div className="mt-4 flex items-center justify-center gap-6">
            <Link to="/terms" className={cn(theme.typography.bodyTiny, "hover:text-brand-600")}>
              Terms
            </Link>
            <Link to="/privacy" className={cn(theme.typography.bodyTiny, "hover:text-brand-600")}>
              Privacy
            </Link>
            <Link to="/contact" className={cn(theme.typography.bodyTiny, "hover:text-brand-600")}>
              Contact
            </Link>
          </div>
          <p className={cn(theme.typography.bodyTiny, "mt-4")}>
            © {new Date().getFullYear()} Costally. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}