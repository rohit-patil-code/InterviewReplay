"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import useSWR from "swr";
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
    Loader2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    RotateCcw
} from "lucide-react";
import { useState, useEffect } from "react";
import { authApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";

interface Problem {
    id: string;
    title: string;
    company: string;
    difficulty: string;
    status?: string; 
    created_at: string;
}

const DifficultyBadge = ({ level }: { level: string }) => {
    const colors: Record<string, string> = {
        easy: "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20",
        medium: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20",
        hard: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20",
    };
    const colorClass = colors[level.toLowerCase()] || colors["medium"];
    return <Badge variant="outline" className={colorClass}>{level}</Badge>;
};

export default function DashboardPage() {
    const router = useRouter();
    
    // Filter & Sort State
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [difficulty, setDifficulty] = useState("all");
    const [company, setCompany] = useState("all");
    const [sort, setSort] = useState("newest");
    const [problemToDelete, setProblemToDelete] = useState<string | null>(null);

    // Search Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: problems = [], isLoading: loading, mutate } = useSWR<Problem[]>(
        ["problems", debouncedSearch, difficulty, company, sort],
        async () => {
            const response = await authApi.getProblems({
                search: debouncedSearch,
                difficulty,
                company,
                sort
            });
            return response.data.problems as Problem[];
        },
        { refreshInterval: 3000 }
    );

    // Extract unique companies from fetched problems for the filter dropdown
    // Note: In a real app, this might come from a separate metadata API
    const [uniqueCompanies, setUniqueCompanies] = useState<string[]>([]);
    
    useEffect(() => {
        if (problems && problems.length > 0 && company === 'all' && !debouncedSearch) {
             const companies = Array.from(new Set(problems.map(p => p.company))).sort();
             setUniqueCompanies(companies);
        }
    }, [problems]);

    const handleDelete = async () => {
        if (!problemToDelete) return;
        try {
            await authApi.deleteProblem(problemToDelete);
            await mutate();
        } catch (error) {
            console.error("Failed to delete problem:", error);
        } finally {
            setProblemToDelete(null);
        }
    };

    const handleReset = () => {
        setSearch("");
        setDebouncedSearch("");
        setDifficulty("all");
        setCompany("all");
        setSort("newest");
    };

    const toggleSort = (field: string) => {
        if (field === 'difficulty') {
            setSort(sort === 'difficulty_asc' ? 'difficulty_desc' : 'difficulty_asc');
        } else if (field === 'title') {
            setSort(sort === 'title_asc' ? 'title_desc' : 'title_asc');
        } else {
            setSort(sort === 'newest' ? 'oldest' : 'newest');
        }
    };

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
            <div className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by title, company, or tag..."
                            className="pl-9 bg-background/50 border-border/50 focus-visible:ring-1"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full lg:w-auto">
                        {/* Difficulty Filter */}
                        <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger className="bg-background/50 border-border/50">
                                <SelectValue placeholder="Difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Difficulties</SelectItem>
                                <SelectItem value="Easy">Easy</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Company Filter */}
                        <Select value={company} onValueChange={setCompany}>
                            <SelectTrigger className="bg-background/50 border-border/50">
                                <SelectValue placeholder="Company" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Companies</SelectItem>
                                {uniqueCompanies.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Sort Order */}
                        <Select value={sort} onValueChange={setSort}>
                            <SelectTrigger className="bg-background/50 border-border/50">
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                                <SelectItem value="difficulty_asc">Difficulty (Easy to Hard)</SelectItem>
                                <SelectItem value="difficulty_desc">Difficulty (Hard to Easy)</SelectItem>
                                <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                                <SelectItem value="title_desc">Title (Z-A)</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button 
                            variant="outline" 
                            className="gap-2 text-muted-foreground border-border/50 bg-background/50"
                            onClick={handleReset}
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset
                        </Button>
                    </div>
                </div>
            </div>

            {/* 3. The Data Table */}
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('title')}>
                                <div className="flex items-center gap-1">
                                    Problem Name
                                    {sort.includes('title') ? (sort === 'title_asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                </div>
                            </TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('difficulty')}>
                                <div className="flex items-center gap-1">
                                    Difficulty
                                    {sort.includes('difficulty') ? (sort === 'difficulty_asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                </div>
                            </TableHead>
                            <TableHead>Test Cases</TableHead>
                            <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('date')}>
                                <div className="flex items-center gap-1">
                                    Created
                                    {sort === 'newest' ? <ArrowDown className="h-3 w-3 text-primary" /> : sort === 'oldest' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                </div>
                            </TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : problems.length > 0 ? (
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
                                    <TableCell>
                                        {problem.status === 'processing' ? (
                                            <Badge variant="secondary" className="animate-pulse bg-secondary/50 text-muted-foreground">Processing...</Badge>
                                        ) : problem.status === 'generated' ? (
                                            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 shadow-none border-green-500/20 border">Generated</Badge>
                                        ) : (
                                            <Badge variant="outline" className="opacity-50 text-muted-foreground">{problem.status || 'Pending'}</Badge>
                                        )}
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
                                        <p className="text-sm mb-4">Try adjusting your filters or search query.</p>
                                        <Button variant="outline" className="gap-2" onClick={handleReset}>
                                            <RotateCcw className="h-4 w-4" /> Reset Filters
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


