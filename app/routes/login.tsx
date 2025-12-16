import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, Link, redirect, useActionData, useNavigation, useSearchParams } from "react-router";
import { createUserSession, getUserId } from "~/lib/session.server";
import { verifyLogin } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/dashboard");
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo")?.toString() || "/dashboard";

  if (typeof email !== "string" || !email.includes("@")) {
    return { errors: { email: "Invalid email", password: null } };
  }

  const user = await verifyLogin(email, password as string);
  if (!user) {
    return { errors: { email: "Invalid email or password", password: null } };
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: true,
    redirectTo,
  });
}

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <h1 className="text-2xl font-bold">Log in to your account</h1>
        <Form method="post" className="space-y-6">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div>
            <label className="block text-sm font-medium">Email address</label>
            <input name="email" type="email" required className="w-full border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input name="password" type="password" required className="w-full border px-3 py-2" />
          </div>
          {actionData?.errors?.email && <p className="text-red-500">{actionData.errors.email}</p>}
          <button type="submit" className="w-full bg-blue-500 py-2 text-white">
            {navigation.state === "submitting" ? "Logging in..." : "Log In"}
          </button>
          <div className="text-center text-sm">
            Don't have an account? <Link className="text-blue-500 underline" to="/signup">Sign up</Link>
          </div>
        </Form>
      </div>
    </div>
  );
}