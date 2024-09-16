import { generateId } from "lucia";
import { db } from "./db.server";

export function findUserByProvider({
  providerName,
  providerId,
}: {
  providerName: string;
  providerId: string;
}): Promise<{ userId: string } | null> {
  return db.account.findUnique({
    where: {
      providerName_providerId: {
        providerName,
        providerId,
      },
    },
    select: {
      userId: true,
    },
  });
}

export function findUserByEmail(email: string): Promise<{ id: string } | null> {
  return db.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });
}

export function createUser({
  email,
  username,
}: {
  email: string;
  username: string;
}): Promise<{ id: string }> {
  const userId = generateId(15);
  return db.user.create({
    data: {
      id: userId,
      email: email,
      username: username,
    },
  });
}

export async function createProviderAccount({
  email,
  username,
  providerName,
  providerId,
}: {
  email: string;
  providerName: string;
  providerId: string;
  username: string;
}): Promise<{ id: string }> {
  let user = await findUserByEmail(email);

  if (!user) {
    user = await createUser({
      email,
      username,
    });
  }

  await db.account.create({
    data: {
      userId: user.id,
      providerName,
      providerId,
    },
  });

  return user;
}
