import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models";
import { verifyPassword, signAccessToken } from "@/lib/auth";
import { fail } from "@/lib/api";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid login payload", 422, parsed.error.flatten());

    await connectDB();
    const user = await UserModel.findOne({ email: parsed.data.email, isActive: true });
    if (!user?.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return fail("Invalid credentials", 401);
    }

    const token = await signAccessToken(String(user._id), user.role);
    await UserModel.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

    const response = NextResponse.json({
      success: true,
      data: { user: { id: user._id, email: user.email, role: user.role } },
    });

    response.cookies.set("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Login failed", 500);
  }
}