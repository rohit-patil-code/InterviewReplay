import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
    return (
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
    );
}
