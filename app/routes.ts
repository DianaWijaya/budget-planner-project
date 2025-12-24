import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("logout", "routes/logout.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("transactions", "routes/transactions.tsx"),
  route("transactions/new", "routes/transactions.new.tsx"),
  route("transactions/:id/edit", "routes/transactions.$id.edit.tsx"),
  route("budgets", "routes/budgets.tsx"),
  route("budgets/new", "routes/budgets.new.tsx"),
  // route("budgets/:id/edit", "routes/budgets.$id.edit.tsx"),
  route("incomes", "routes/incomes.tsx"),
  route("incomes/new", "routes/incomes.new.tsx"),
  // route("incomes/:id/edit", "routes/incomes.$id.edit.tsx"),
] satisfies RouteConfig;