import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    CheckCircle2,
    Clock,
    XCircle,
    PlayCircle,
    Pencil,
    Trash2,
    FileQuestion
} from "lucide-react";

// Mock Data
const MOCK_PROBLEMS = [
    {
        id: "1",
        status: "solved",
        title: "Maximize Grid Value with K-Steps",
        company: "Amazon",
        difficulty: "Hard",
        lastPracticed: "2 days ago",
    },
    {
        id: "2",
        status: "draft",
        title: "String Compression III",
        company: "Google",
        difficulty: "Medium",
        lastPracticed: "5 hours ago",
    },
    {
        id: "3",
        status: "failed",
        title: "Graph Coloring Validation",
        company: "Meta",
        difficulty: "Medium",
        lastPracticed: "1 week ago",
    },
    {
        id: "4",
        status: "solved",
        title: "Two Sum with Twist",
        company: "Uber",
        difficulty: "Easy",
        lastPracticed: "1 month ago",
    },
    {
        id: "5",
        status: "draft",
        title: "Server Load Balancer Simulation",
        company: "TikTok",
        difficulty: "Hard",
        lastPracticed: "Just now",
    },
];

const DifficultyBadge = ({ level }: { level: string }) => {
    const colors: Record<string, string> = {
        Easy: "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20",
        Medium: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20",
        Hard: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20",
    };
    return <Badge variant="outline" className={colors[level]}>{level}</Badge>;
};

export default function DashboardPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Your Problems</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage, practice, and track your reconstructed interviews.
                    </p>
                </div>
                <Button className="font-semibold shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" />
                    Recall New Problem
                </Button>
            </div>

            {/* 2. Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title, company, or tag..."
                        className="pl-9 bg-background/50 border-border/50 focus-visible:ring-1"
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="gap-2 w-full sm:w-auto text-muted-foreground border-border/50 bg-background/50">
                        <Filter className="h-4 w-4" />
                        Status: All
                    </Button>
                    <Button variant="ghost" className="hidden sm:inline-flex text-muted-foreground text-xs">
                        Reset
                    </Button>
                </div>
            </div>

            {/* 3. The Data Table */}
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead >Problem Name</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Difficulty</TableHead>
                            <TableHead>Last Practiced</TableHead>
                            <TableHead >Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {MOCK_PROBLEMS.length > 0 ? (
                            MOCK_PROBLEMS.map((problem) => (
                                <TableRow key={problem.id} className="hover:bg-muted/30 border-border/50 group cursor-pointer transition-colors">
                                    <TableCell>
                                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                            {problem.title}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-normal opacity-80">{problem.company}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DifficultyBadge level={problem.difficulty} />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {problem.lastPracticed}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem className="gap-2 cursor-pointer">
                                                    <PlayCircle className="h-4 w-4 text-green-500" /> Practice
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2 cursor-pointer">
                                                    <Pencil className="h-4 w-4" /> Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="gap-2 text-red-500 focus:text-red-500 cursor-pointer">
                                                    <Trash2 className="h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <FileQuestion className="h-8 w-8 opacity-50" />
                                        </div>
                                        <p className="text-lg font-medium">No problems found</p>
                                        <p className="text-sm mb-4">You haven't reconstructed any problems yet.</p>
                                        <Button variant="outline" className="gap-2">
                                            <Plus className="h-4 w-4" /> Recall Problem
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
