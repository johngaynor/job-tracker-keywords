import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 py-8 border-t border-zinc-200 dark:border-zinc-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Built by John Gaynor</span>
          <span>•</span>
          <a
            href="https://github.com/johngaynor/job-tracker-keywords"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            View on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
