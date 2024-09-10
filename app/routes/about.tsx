import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader() {
  return json({ message: "Hello from the server!" });
}

export default function About() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>About route</h1>
      <h1>{data.message}</h1>
    </div>
  );
}
