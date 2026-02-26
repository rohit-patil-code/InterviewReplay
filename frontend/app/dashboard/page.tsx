"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
    FileQuestion,
    Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface Problem {
    id: string;
    title: string;
    company: string;
    difficulty: string;
    status?: string; // Optional for now as DB might not have it yet
    created_at: string;
}

const DifficultyBadge = ({ level }: { level: string }) => {
    const colors: Record<string, string> = {
        easy: "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20",
        medium: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20",
        hard: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20",
    };
    // Fallback for case sensitivity or unknown levels
    const colorClass = colors[level.toLowerCase()] || colors["medium"];
    return <Badge variant="outline" className={colorClass}>{level}</Badge>;
};

export default function DashboardPage() {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [problemToDelete, setProblemToDelete] = useState<string | null>(null);
    const router = useRouter();

    const fetchProblems = async () => {
        try {
            const response = await authApi.getProblems();
            setProblems(response.data.problems);
        } catch (error) {
            console.error("Failed to fetch problems:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProblems();
    }, []);

    const handleDelete = async () => {
        if (!problemToDelete) return;

        try {
            await authApi.deleteProblem(problemToDelete);
            // Refresh the list
            await fetchProblems();
        } catch (error) {
            console.error("Failed to delete problem:", error);
        } finally {
            setProblemToDelete(null); // Close dialog
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

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
                <Button className="font-semibold shadow-lg shadow-primary/20" asChild>
                    <Link href="/dashboard/create">
                        Recall New Problem
                    </Link>
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
                            <TableHead>Created</TableHead>
                            <TableHead >Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {problems.length > 0 ? (
                            problems.map((problem) => (
                                <TableRow
                                    key={problem.id}
                                    className="hover:bg-muted/30 border-border/50 group cursor-pointer transition-colors"
                                    onClick={() => router.push(`/practice/${problem.id}`)}
                                >
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
                                        {formatDistanceToNow(new Date(problem.created_at), { addSuffix: true }).replace("about ", "")}
                                    </TableCell>
                                    <TableCell>
                                        <AlertDialog open={problemToDelete === problem.id} onOpenChange={(isOpen: boolean) => !isOpen && setProblemToDelete(null)}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                                                        <Link href={`/practice/${problem.id}`}>
                                                            <PlayCircle className="h-4 w-4 text-green-500" /> Practice
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                                                        <Link href={`/dashboard/create?edit=${problem.id}`}>
                                                            <Pencil className="h-4 w-4" /> Edit Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="gap-2 text-red-500 focus:text-red-500 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setProblemToDelete(problem.id);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete your problem record from our servers.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete();
                                                    }} className="bg-red-500 hover:bg-red-600 focus:ring-red-500">
                                                        Continue
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
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
                                        <Button variant="outline" className="gap-2" asChild>
                                            <Link href="/dashboard/create">
                                                <Plus className="h-4 w-4" /> Recall Problem
                                            </Link>
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
