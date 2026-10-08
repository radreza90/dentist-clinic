import { verifyAccessToken } from "./auth";

export const permissions = {
  super_admin: ["*"],
  admin: ["content:read","content:write","media:write","comments:read","comments:write","appointments:read","appointments:write","settings:read","settings:write"],
  manager: ["content:read","comments:read","comments:write","appointments:read","appointments:write","media:write"],
  editor: ["content:read","content:write","media:write"],
  patient: ["appointments:self"],
} as const;

function cookieValue(header: string | null, name: string) {
  if (!header) return null;
  const item = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(name + "="));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

export async function getAuth(req: Request) {
  const token =
    cookieValue(req.headers.get("cookie"), "access_token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    null;
  if (!token) return null;
  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

export function can(role: string | undefined, permission: string) {
  const list = (permissions as Record<string, readonly string[]>)[role || ""];
  return !!list && (list.includes("*") || list.includes(permission));
}
