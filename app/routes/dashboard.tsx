import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Form } from "react-router";
import { requireUserId, getUser } from "~/lib/session.server";

// This ensures only logged-in users can see this page
export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const user = await getUser(request);
  return { user };
}

export default function Dashboard() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="p-8 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold">Budget Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{user?.email}</span>
          <Form action="/logout" method="post">
            <button className="text-red-500 hover:underline text-sm font-medium">
              Logout
            </button>
          </Form>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wider">Total Balance</h3>
          <p className="text-3xl font-bold mt-2">$0.00</p>
        </div>
        {/* We will add Income/Expense cards here later */}
      </div>

      <div className="mt-10 p-10 border-2 border-dashed border-gray-200 rounded-xl text-center">
        <p className="text-gray-500">No transactions yet. Ready to start budgeting?</p>
      </div>
    </div>
  );
}