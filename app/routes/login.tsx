import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Form } from "@remix-run/react";
import { generateCodeVerifier, generateState } from "arctic";
import { github, googleAuth } from "~/lib/auth.server";
import { combineHeaders, oauthCodeVerifier, oauthState } from "~/lib/cookies";

export async function loader({ context }: LoaderFunctionArgs) {
  if (context.user) {
    return redirect("/");
  }
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const data = await request.formData();
  const provider = data.get("provider") as string;
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  let url = "";
  if (provider === "github") {
    const gitUrl = await github.createAuthorizationURL(state, {
      scopes: ["user:email"],
    });
    url = gitUrl.toString();
  } else if (provider === "google") {
    const googleUrl = await googleAuth.createAuthorizationURL(
      state,
      codeVerifier,
      {
        scopes: ["profile", "email"],
      }
    );
    url = googleUrl.toString();
  }

  return redirect(url.toString(), {
    headers: combineHeaders(
      {
        "Set-Cookie": await oauthState.serialize(state),
      },
      {
        "Set-Cookie": await oauthCodeVerifier.serialize(codeVerifier),
      }
    ),
  });
}
export default function Login() {
  return (
    <div>
      <h1>Login Route</h1>
      <Form method="post" className="flex flex-col gap-4">
        <button name="provider" value="github">
          Github
        </button>
        <button name="provider" value="google">
          Google
        </button>
      </Form>
    </div>
  );
}
