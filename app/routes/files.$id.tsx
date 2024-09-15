import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { db } from "~/lib/db.server";

export async function loader({ params, context }: LoaderFunctionArgs) {
  if (!context.user) {
    return json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!params.id) {
    return json({ message: "Invalid file id" }, { status: 400 });
  }

  const file = await db.file.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!file) {
    return json({ message: "File not found" }, { status: 404 });
  }

  return new Response(file.blob, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": Buffer.byteLength(file.blob).toString(),
      "Content-Disposition": `inline; filename="${file.name}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
