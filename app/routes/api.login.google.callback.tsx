import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { OAuth2RequestError } from "arctic";
import { googleAuth, lucia } from "~/lib/auth.server";
import { oauthCodeVerifier, oauthState } from "~/lib/cookies";
import { createProviderAccount, findUserByProvider } from "~/lib/user.server";

interface GoogleUser {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code") ?? null;
  const state = url.searchParams.get("state") ?? null;
  const cookieHeader = request.headers.get("Cookie");
  const storedState =
    ((await oauthState.parse(cookieHeader)) as string) ?? null;
  const storedCodeVerifier =
    ((await oauthCodeVerifier.parse(cookieHeader)) as string) ?? null;


  if (!code || !state || !storedState ||!storedCodeVerifier || state !== storedState) {
    return json({}, { status: 400 });
  }

  try {
    const tokens = await googleAuth.validateAuthorizationCode(
      code,
      storedCodeVerifier
    );
    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }
    );
    const googleUser: GoogleUser = await response.json();

    const existingUser = await findUserByProvider({
      providerId: googleUser.sub,
      providerName: "google",
    });

    if (existingUser) {
      const session = await lucia.createSession(existingUser.userId, {});
      return redirect("/", {
        headers: {
          "Set-Cookie": lucia.createSessionCookie(session.id).serialize(),
        },
      });
    }

    const { id: userId } = await createProviderAccount({
      email: googleUser.email,
      username: googleUser.name,
      providerId: googleUser.sub,
      providerName: "google",
    });

    const session = await lucia.createSession(userId, {});
    return redirect("/", {
      headers: {
        "Set-Cookie": lucia.createSessionCookie(session.id).serialize(),
      },
    });
  } catch (e) {
    if (
      e instanceof OAuth2RequestError &&
      e.message === "bad_verification_code"
    ) {
      // invalid code
      return json("", { status: 400 });
    }

    return json("", { status: 500 });
  }
}
