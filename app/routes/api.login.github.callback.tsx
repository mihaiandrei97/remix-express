import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { OAuth2RequestError } from "arctic";
import { generateId } from "lucia";
import { github, lucia } from "~/lib/auth.server";
import { oauthState } from "~/lib/cookies";
import { db } from "~/lib/db.server";

interface GitHubUser {
  id: number;
  login: string; // username
  email?: string;
}

interface GithubEmails {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code") ?? null;
  const state = url.searchParams.get("state") ?? null;
  const cookieHeader = request.headers.get("Cookie");
  const storedState =
    ((await oauthState.parse(cookieHeader)) as string) ?? null;

  if (!code || !state || !storedState || state !== storedState) {
    return json({}, { status: 400 });
  }

  try {
    const tokens = await github.validateAuthorizationCode(code);
    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    const githubUser: GitHubUser = await githubUserResponse.json();

    const existingUser = await db.account.findUnique({
      where: {
        providerName_providerId: {
          providerName: "github",
          providerId: githubUser.id.toString(),
        },
      },
      select: {
        userId: true,
      },
    });

    if (existingUser) {
      const session = await lucia.createSession(existingUser.userId, {});
      return redirect("/", {
        headers: {
          "Set-Cookie": lucia.createSessionCookie(session.id).serialize(),
        },
      });
    }

    const githubUserEmailResponse = await fetch(
      "https://api.github.com/user/emails",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }
    );
    const githubUserEmails: GithubEmails[] =
      await githubUserEmailResponse.json();
    const primaryEmail =
      githubUserEmails.find((email) => email.primary && email.verified)
        ?.email || null;

    if (!primaryEmail) {
      return json("Email missing on github.", { status: 400 });
    }

    const userId = generateId(15);
    await db.user.create({
      data: {
        id: userId,
        email: primaryEmail,
        username: githubUser.login,
        accounts: {
          create: {
            providerName: "github",
            providerId: githubUser.id.toString(),
          },
        },
      },
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
