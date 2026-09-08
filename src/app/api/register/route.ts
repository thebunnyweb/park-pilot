import bcrypt from "bcryptjs";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
    }
    const { name, email, password } = parsed.data;
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return json({ error: "An account with that email already exists" }, 409);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), passwordHash },
      select: { id: true, email: true, name: true },
    });
    return json({ user }, 201);
  } catch (err) {
    return handleError(err);
  }
}
