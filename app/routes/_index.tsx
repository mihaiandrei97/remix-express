import { ActionFunctionArgs, json, redirect, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { lucia } from "~/lib/auth.server";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader({ context }: LoaderFunctionArgs) {
  return json({
    user: context.user,
    session: context.session,
  })
}

export async function action({ context }: ActionFunctionArgs) {
  if(!context.session){
    return json({ message: "No session found" }, { status: 404 });
  }
  await lucia.invalidateSession(context.session.id);
  const sessionCookie = lucia.createBlankSessionCookie();
  return redirect("/login", {
    headers: {
      "Set-Cookie": sessionCookie.serialize(),
    },
  });
}

export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="font-sans p-4">
      <h1 className="text-3xl">Welcome to Remix</h1>
      <pre>
        User:
        <code>{JSON.stringify(data.user, null, 2)}</code>
      </pre>
      <ul className="mt-4 pl-6 space-y-2">
        <li>
          <Link
            className="text-blue-700 underline visited:text-purple-900"
            to="/login"
          >
            Login
          </Link>
        </li>
        <li>
          <Link
            className="text-blue-700 underline visited:text-purple-900"
            to="/pricing"
          >
            Pricing
          </Link>
        </li>
        {data.user && <li>
          <Form method="post">
            <button className="pointer">
              Logout
            </button>
          </Form>
        </li>}
      </ul>
    </div>
  );
}
