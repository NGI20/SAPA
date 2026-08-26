import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

const sessionCookie = "sapa_session";
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "sapa-development-secret");

type SessionPayload = { userId: string; email: string };

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function getSessionFromToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || typeof payload.email !== "string") return null;
    return { userId: payload.sub, email: payload.email };
  } catch { return null; }
}

export async function getCurrentUser() {
  const session = await getSessionFromToken(cookies().get(sessionCookie)?.value);
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}

export const sessionOptions = {
  httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7,
};
export { sessionCookie };
