import { KeyRound } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ConnectClaude() {
  return (
    <div className="mx-auto max-w-lg space-y-5 py-12 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <KeyRound className="h-6 w-6" />
      </span>
      <h1 className="text-xl font-semibold">Connect an AI key to build plans</h1>
      <p className="text-sm text-muted-foreground">
        The live wait board works without setup. The AI touring planner needs an Anthropic
        or OpenRouter API key so it can turn today&apos;s waits and your travellers into a
        minute-by-minute plan. Add it once in Settings — it&apos;s verified, encrypted, and
        stored on your account.
      </p>
      <Button asChild>
        <Link href="/settings">Add your API key</Link>
      </Button>
    </div>
  );
}
