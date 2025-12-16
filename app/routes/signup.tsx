import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { createUserSession, getUserId } from "~/lib/session.server";
import { createUser, getUserByEmail } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/dashboard");
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || email.length < 3) {
    return { errors: { email: "Email is invalid", password: null } };
  }
  if (typeof password !== "string" || password.length < 6) {
    return { errors: { email: null, password: "Password is too short" } };
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return { errors: { email: "A user already exists with this email", password: null } };
  }

  const user = await createUser({ email, password });
  return createUserSession({
    request,
    userId: user.id,
    remember: false,
    redirectTo: "/dashboard",
  });
}

export default function SignUp() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <Form method="post" className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Email address</label>
            <input name="email" type="email" required className="w-full border px-3 py-2" />
            {actionData?.errors?.email && <p className="text-red-500">{actionData.errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input name="password" type="password" required className="w-full border px-3 py-2" />
            {actionData?.errors?.password && <p className="text-red-500">{actionData.errors.password}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 py-2 text-white">
            {isSubmitting ? "Creating..." : "Sign Up"}
          </button>
          <div className="text-center text-sm">
            Already have an account? <Link className="text-blue-500 underline" to="/login">Log in</Link>
          </div>
        </Form>
      </div>
    </div>
  );
}