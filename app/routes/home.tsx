import { Link } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Budget Planner | Home" },
    { name: "description", content: "Take control of your finances." },
  ];
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <header className="mb-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
          Budget <span className="text-blue-600">Planner</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Simple, powerful tracking for your income and expenses.
        </p>
      </header>

      <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
        <Link
          to="/login"
          className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
        >
          Log In
        </Link>
        <Link
          to="/signup"
          className="rounded-lg border border-gray-300 bg-white px-8 py-3 font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          Create Account
        </Link>
      </div>

      <footer className="mt-16 text-sm text-gray-400">
        Built with React Router v7 & Prisma
      </footer>
    </div>
  );
}