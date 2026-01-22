import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Brain, Menu, ArrowRight } from "lucide-react";

export function SiteHeader() {
    return (
        <header className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl flex justify-center">
            <nav className="flex items-center justify-between w-full sm:w-auto sm:gap-6 rounded-full border border-border/40 bg-background/80 backdrop-blur-md py-2 px-4 shadow-lg ring-1 ring-white/5 transition-all hover:ring-white/10 hover:bg-background/90 duration-300">

                <div className="flex items-center gap-6">
                    {/* Brand */}
                    <Link href="/" className="flex items-center gap-2 group shrink-0">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                            <Brain className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-semibold text-sm tracking-tight text-foreground/90 group-hover:text-foreground transition-colors hidden sm:inline-block">
                            OA Recall
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-5">
                        <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Features
                        </Link>
                        <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            How it Works
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -ml-2">
                                    <Menu className="h-4 w-4" />
                                    <span className="sr-only">Menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="top" className="w-full rounded-b-2xl pt-16">
                                <div className="flex flex-col gap-4 items-center">
                                    <Link href="#features" className="text-lg font-medium">Features</Link>
                                    <Link href="#how-it-works" className="text-lg font-medium">How it Works</Link>
                                    <Button className="w-full max-w-xs mt-2" asChild>
                                        <Link href="/dashboard">Start Reconstructing</Link>
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Divider (Desktop) */}
                    <div className="hidden sm:block h-4 w-px bg-border/50" />

                    {/* Action */}
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 group/btn pl-1"
                    >
                        <span className="text-xs font-semibold text-foreground/90 group-hover/btn:text-foreground transition-colors pb-px border-b border-transparent group-hover/btn:border-primary">
                            Start Reconstructing
                        </span>
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                            <ArrowRight className="h-3 w-3 text-primary-foreground" />
                        </div>
                    </Link>
                </div>
            </nav>
        </header>
    );
}
