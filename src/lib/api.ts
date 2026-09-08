import { auth } from "@/auth";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError(401, "Not signed in");
  return session.user.id;
}

export function json(data: unknown, init?: number | ResponseInit): Response {
  const responseInit = typeof init === "number" ? { status: init } : init;
  return Response.json(data, responseInit);
}

export function handleError(err: unknown): Response {
  if (err instanceof HttpError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  const message = err instanceof Error ? err.message : "Unexpected error";
  return Response.json({ error: message }, { status: 500 });
}
