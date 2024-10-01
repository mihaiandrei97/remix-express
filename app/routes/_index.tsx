import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader({ context }: LoaderFunctionArgs) {
  return json({
    context,
  });
}
export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="font-sans p-4">
      <h1 className="text-3xl">Welcome to Remix + express</h1>
      <pre>
        <code className="text-sm bg-gray-100 p-2 rounded-md">
          {JSON.stringify(data, null, 2)}
        </code>
      </pre>
      <ul className="list-disc mt-4 pl-6 space-y-2">
        <li>
          <a
            className="text-blue-700 underline visited:text-purple-900"
            target="_blank"
            href="https://remix.run/start/quickstart"
            rel="noreferrer"
          >
            5m Quick Start
          </a>
        </li>
        <li>
          <a
            className="text-blue-700 underline visited:text-purple-900"
            target="_blank"
            href="https://remix.run/start/tutorial"
            rel="noreferrer"
          >
            30m Tutorial
          </a>
        </li>
        <li>
          <a
            className="text-blue-700 underline visited:text-purple-900"
            target="_blank"
            href="https://remix.run/docs"
            rel="noreferrer"
          >
            Remix Docs
          </a>
        </li>
      </ul>
    </div>
  );
}
