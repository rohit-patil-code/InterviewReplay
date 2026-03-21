import { CloudLightning, FileCode2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HowItWorksSection() {
    return (
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
                            We generate a NodeJs script to produce large-scale test cases (N=10^5) and run a brute-force validator.
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
    );
}
