import { Form, useLoaderData } from "@remix-run/react";

import {
  type ActionFunctionArgs,
  json,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { db } from "~/lib/db.server";

const MAX_SIZE = 1024 * 1024 * 5; // 5MB

export async function action({ context, request }: ActionFunctionArgs) {
  if (!context.user) {
    return json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await unstable_parseMultipartFormData(
    request,
    unstable_createMemoryUploadHandler({ maxPartSize: MAX_SIZE })
  );
  const file = formData.get("file");
  // if file is not instance of File, return error
  if (!(file instanceof File)) {
    return json({ message: "Invalid file" }, { status: 400 });
  }
  const altText = formData.get("altText");
  // if altText is not instance of String, return error
  if (typeof altText !== "string") {
    return json({ message: "Invalid alt text" }, { status: 400 });
  }

  console.log("file", file);
  const dbFile = await db.file.create({
    select: { id: true },
    data: {
      contentType: file.type,
      name: file.name,
      blob: Buffer.from(await file.arrayBuffer()),
    },
  });

  return json({ fileId: dbFile.id });
}

export async function loader() {
  const files = await db.file.findMany({
    select: { id: true, name: true },
  });
  return json({ files });
}

export default function Upload() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <div>
      <Form method="POST" encType="multipart/form-data">
        <label htmlFor="file-input">File</label>
        <input id="file-input" type="file" name="file" />
        <input
          id="alt-text"
          type="text"
          name="altText"
          placeholder="Alt text"
        />
        <button type="submit">Upload</button>
      </Form>
      <h1>Uploaded files:</h1>
      <ul className="list-disc ml-4">
        {loaderData.files.map((file) => (
          <li key={file.id}>
            <a href={`/files/${file.id}`} download={true}>{file.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
