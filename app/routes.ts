import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/authentication/login.tsx"),
  route("signup", "routes/authentication/signup.tsx"),
  route("logout", "routes/authentication/logout.tsx"),

  route("dashboard", "routes/dashboard.tsx"),

  route("transactions", "routes/transaction/transactions.tsx"),
  route("transactions/new", "routes/transaction/transactions.new.tsx"),
  route("transactions/:id/edit", "routes/transaction/transactions.$id.edit.tsx"),
  route("transactions/:id", "routes/transaction/transactions.$id.tsx"),

  route("budgets", "routes/budget/budgets.tsx"),

  route("incomes", "routes/income/incomes.tsx"),
  route("incomes/new", "routes/income/incomes.new.tsx"),
  route("incomes/:id/edit", "routes/income/incomes.$id.edit.tsx"),
] satisfies RouteConfig;