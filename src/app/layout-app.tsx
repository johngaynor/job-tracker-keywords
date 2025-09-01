"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Briefcase,
  Tags,
  Settings,
  Info,
  LayoutDashboard,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: LayoutProps) {
  const pathname = usePathname();

  const tabs = [
    { value: "/", label: "Dashboard", icon: LayoutDashboard },
    { value: "/applications", label: "Applications", icon: Briefcase },
    { value: "/employers", label: "Employers", icon: Building2 },
    { value: "/keywords", label: "Keywords", icon: Tags },
    { value: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Job Application Tracker
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Info className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>About Job Application Tracker</DialogTitle>
                      <DialogDescription>
                        Track your job applications and identify popular skills
                        and keywords to optimize your resume and skill
                        acquisition. All data is stored locally. Happy searching
                        :)
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mb-6">
            {/* Desktop Navigation - md and up */}
            <div className="hidden md:flex bg-muted p-0.5 rounded-lg w-full">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive =
                  tab.value === "/"
                    ? pathname === "/"
                    : pathname.startsWith(tab.value);
                return (
                  <Link
                    key={tab.value}
                    href={tab.value}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors flex-1 justify-center text-sm ${
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Navigation - below md */}
            <div className="md:hidden">
              <div className="flex bg-muted p-0.5 rounded-lg w-full">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive =
                    tab.value === "/"
                      ? pathname === "/"
                      : pathname.startsWith(tab.value);
                  return (
                    <Tooltip key={tab.value}>
                      <TooltipTrigger asChild>
                        <Link
                          href={tab.value}
                          className={`h-8 flex-1 flex items-center justify-center rounded-md transition-colors ${
                            isActive
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tab.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">{children}</div>
          {/* Footer */}
          <Footer />
        </div>
      </div>
    </TooltipProvider>
  );
}
