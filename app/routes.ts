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
] satisfies RouteConfig;