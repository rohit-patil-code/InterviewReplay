import Link from "next/link";
import { Brain, Github, Twitter, Code2 } from "lucide-react";

export function SiteFooter() {
    return (
        <footer className="border-t bg-background py-12 md:py-16 w-full">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12">

                    {/* Col 1: Brand */}
                    <div className="col-span-1 md:col-span-1 space-y-4 flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                <Brain className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-bold text-lg tracking-tight">OA Recall</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Turn your failed coding interviews into your greatest learning assets. Reconstruct, verify, and master.
                        </p>
                    </div>

                    {/* Col 2: Product */}
                    <div className="col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
                        <h3 className="font-semibold mb-4">Product</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                            <li><Link href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    {/* Col 3: Resources */}
                    <div className="col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
                        <h3 className="font-semibold mb-4">Resources</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Documentation</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Support</Link></li>
                        </ul>
                    </div>

                    {/* Col 4: Legal/Social Placeholder */}
                    <div className="col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
                        <h3 className="font-semibold mb-4">Connect</h3>
                        <div className="flex gap-4">
                            <Link href="#" className="text-muted-foreground hover:text-foreground">
                                <Github className="h-5 w-5" />
                                <span className="sr-only">GitHub</span>
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-foreground">
                                <Twitter className="h-5 w-5" />
                                <span className="sr-only">Twitter</span>
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-foreground">
                                <Code2 className="h-5 w-5" />
                                <span className="sr-only">Discord</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} OA Recall. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-xs text-muted-foreground">
                        <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
                        <Link href="#" className="hover:text-foreground">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
