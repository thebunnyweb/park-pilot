import { FerrisWheel } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-semibold">
        <FerrisWheel className="h-6 w-6 text-primary" />
        Park Pilot
      </Link>
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-8 max-w-sm text-center text-xs text-muted-foreground">
        Real-time waits Powered by Queue-Times.com. Not affiliated with any park operator.
      </p>
    </div>
  );
}
