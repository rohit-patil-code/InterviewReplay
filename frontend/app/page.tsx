import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Brain, FileCode2, SearchX, CloudLightning, CheckCircle2,
  AlertTriangle, ArrowRight, Menu, Github, Twitter, Code2
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 flex flex-col">

      {/* 1. Header (Sticky & Blurry) */}
      {/* 1. Navbar (Floating Pill Style) */}
      <div className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl flex justify-center">
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
      </div>

      <main className="flex-1">
        {/* Section A: The Hero */}
        <section className="container mx-auto px-4 py-20 md:py-32 flex flex-col items-center text-center space-y-8">


          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl text-balance animate-in fade-in slide-in-from-bottom-4 duration-700 leading-tight">
            Don't Let a <span className="text-primary">Failed OA</span> Be a <br className="hidden md:block" /> Wasted Opportunity
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl text-balance animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150 px-2">
            The first AI-powered platform that helps you reconstruct, archive, and practice the exact questions you faced in your Online Assessments from memory.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 w-full sm:w-auto px-4 sm:px-0">
            <Button size="lg" className="h-12 px-8 text-base font-semibold w-full sm:w-auto" asChild>
              <Link href="/dashboard">
                Start Reconstructing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base w-full sm:w-auto" asChild>
              <Link href="#how-it-works">
                How it Works
              </Link>
            </Button>
          </div>
        </section>

        {/* Section B: The Pain Points Grid */}
        <section id="features" className="bg-muted/30 py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">Why traditional practice isn't enough</h2>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto px-4">
                You failed because of specific constraints, not generic "similar problems."
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
              <Card className="bg-card/50 border-primary/10 hover:border-primary/20 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                    <Brain className="h-6 w-6 text-red-500" />
                  </div>
                  <CardTitle className="text-xl">The Memory Gap</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    "It was a graph problem, but with specific weight rules..."
                    Hours after the test, the critical edge cases fade away, leaving you with useless fragments.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/10 hover:border-primary/20 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                    <SearchX className="h-6 w-6 text-orange-500" />
                  </div>
                  <CardTitle className="text-xl">The Missing Platform</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Scouring LeetCode or Reddit for "Amazon OA Q2 2024" yields nothing.
                    New and obscure questions don't exist in public databases yet.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/10 hover:border-primary/20 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  </div>
                  <CardTitle className="text-xl">The Hollow Practice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Solving "similar" problems gives false confidence.
                    Unless you practice the <i>exact</i> constraints you missed, you're not patching the hole in your knowledge.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section C: How it Works */}
        <section id="how-it-works" className="py-20 md:py-24 container mx-auto px-4">
          <div className="flex flex-col items-center mb-12 md:mb-16">
            <Badge className="mb-4" variant="outline">The Process</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center">From Fragment to Full Solution</h2>
          </div>

          <div className="max-w-5xl mx-auto space-y-12">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row gap-8 items-center group">
              <div className="flex-1 text-center md:text-right md:pr-12 order-2 md:order-1 px-4 md:px-0">
                <h3 className="text-2xl font-semibold mb-3">Dump Your Memory</h3>
                <p className="text-muted-foreground text-lg">
                  Don't worry about formatting. Just type what you remember: "It was a grid DP where you can't move diagonally..."
                  Our system parses even messy, unstructured notes.
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold shrink-0 border-4 border-background shadow-xl z-10 order-1 md:order-2">
                1
              </div>
              <div className="flex-1 md:pl-12 order-3 w-full flex justify-center md:justify-start">
                <div className="bg-muted p-4 rounded-xl border border-border w-full max-w-sm">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <CloudLightning className="h-4 w-4" />
                    <span className="text-sm">Input</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-foreground/20 rounded w-3/4"></div>
                    <div className="h-2 bg-foreground/10 rounded w-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute left-1/2 w-0.5 h-16 bg-border -translate-x-1/2 -translate-y-full transform" style={{ marginTop: '-2rem' }}></div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row gap-8 items-center group">
              <div className="flex-1 md:pr-12 order-3 md:order-1 flex justify-center md:justify-end w-full">
                <div className="bg-card p-4 rounded-xl border border-primary/20 w-full max-w-sm shadow-sm ring-1 ring-primary/5">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <FileCode2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Reconstructed Problem</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-primary/20 rounded w-3/4"></div>
                    <div className="h-2 bg-primary/10 rounded w-1/2"></div>
                    <div className="h-2 bg-primary/10 rounded w-full"></div>
                  </div>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold shrink-0 border-4 border-background shadow-xl z-10 order-1 md:order-2">
                2
              </div>
              <div className="flex-1 text-center md:text-left md:pl-12 order-2 md:order-3 px-4 md:px-0">
                <h3 className="text-2xl font-semibold mb-3">AI Reconstruction</h3>
                <p className="text-muted-foreground text-lg">
                  Our advanced agents infer the missing constraints, define the input/output format, and identify standard algorithmic patterns
                  hidden in your description.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row gap-8 items-center group">
              <div className="flex-1 text-center md:text-right md:pr-12 order-2 md:order-1 px-4 md:px-0">
                <h3 className="text-2xl font-semibold mb-3">Generate & Verify</h3>
                <p className="text-muted-foreground text-lg">
                  We generate a Python script to produce large-scale test cases (N=10^5) and run a brute-force validator.
                  Your code is tested against <i>real</i> data, not just example cases.
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold shrink-0 border-4 border-background shadow-xl z-10 order-1 md:order-2">
                3
              </div>
              <div className="flex-1 md:pl-12 order-3 w-full flex justify-center md:justify-start">
                <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20 w-full max-w-sm">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Test Cases Passed</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-1.5 bg-green-500 rounded-full flex-1"></div>
                    <div className="h-1.5 bg-green-500 rounded-full flex-1"></div>
                    <div className="h-1.5 bg-green-500 rounded-full flex-1"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section D: Call to Action (Pre-footer) */}
        <section className="bg-primary/5 border-t border-primary/10 mt-auto">
          <div className="container mx-auto px-4 py-20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 max-w-xl mx-auto">
              Ready to master the problems that stumped you?
            </h2>
            <Button size="lg" className="h-14 px-10 text-lg shadow-lg shadow-primary/20 w-full sm:w-auto" asChild>
              <Link href="/dashboard">
                Start Reconstructing Now
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* 2. Expanded Footer */}
      <footer className="border-t bg-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12">

            {/* Col 1: Brand */}
            <div className="col-span-1 md:col-span-1 space-y-4">
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
            <div className="col-span-1">
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Col 3: Resources */}
            <div className="col-span-1">
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Support</Link></li>
              </ul>
            </div>

            {/* Col 4: Legal/Social Placeholder */}
            <div className="col-span-1">
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
    </div>
  );
}
