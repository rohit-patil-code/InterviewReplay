import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
    return (
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
    );
}
