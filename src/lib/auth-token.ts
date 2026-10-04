import { jwtVerify } from "jose";

const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is not configured");
  return new TextEncoder().encode(value);
};

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return payload;
}