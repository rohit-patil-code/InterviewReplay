import { Brain, SearchX, AlertTriangle } from "lucide-react";
import { FeatureCard } from "@/components/landing/feature-card";

export function FeaturesSection() {
    return (
        <section id="features" className="bg-muted/30 py-20 md:py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">Why traditional practice isn't enough</h2>
                    <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto px-4">
                        You failed because of specific constraints, not generic "similar problems."
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
                    <FeatureCard
                        icon={<Brain className="h-6 w-6 text-red-500" />}
                        title="The Memory Gap"
                        description="&quot;It was a graph problem, but with specific weight rules...&quot; Hours after the test, the critical edge cases fade away, leaving you with useless fragments."
                        badgeColorClass="bg-red-500/10"
                    />

                    <FeatureCard
                        icon={<SearchX className="h-6 w-6 text-orange-500" />}
                        title="The Missing Platform"
                        description="Scouring LeetCode or Reddit for &quot;Amazon OA Q2 2024&quot; yields nothing. New and obscure questions don't exist in public databases yet."
                        badgeColorClass="bg-orange-500/10"
                    />

                    <FeatureCard
                        icon={<AlertTriangle className="h-6 w-6 text-yellow-500" />}
                        title="The Hollow Practice"
                        description="Solving &quot;similar&quot; problems gives false confidence. Unless you practice the <i>exact</i> constraints you missed, you're not patching the hole in your knowledge."
                        badgeColorClass="bg-yellow-500/10"
                    />
                </div>
            </div>
        </section>
    );
}
