export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Live wait times{" "}
          <a
            href="https://queue-times.com/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline underline-offset-2"
          >
            Powered by Queue-Times.com
          </a>
        </p>
        <p>
          Park Pilot is a fan-made planning tool. Not affiliated with, endorsed by, or
          sponsored by The Walt Disney Company, Universal, or any park operator.
        </p>
      </div>
    </footer>
  );
}
