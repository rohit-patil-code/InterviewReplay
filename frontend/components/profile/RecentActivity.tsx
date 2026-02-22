
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActivityItem {
    id: string;
    problemName: string;
    difficulty: "Easy" | "Medium" | "Hard";
    company: string;
    date: string;
    status: "Solved" | "Failed" | "Pending";
}

const mockActivity: ActivityItem[] = [
    { id: "1", problemName: "Two Sum", difficulty: "Easy", company: "Amazon", date: "2 hours ago", status: "Solved" },
    { id: "2", problemName: "LRU Cache", difficulty: "Medium", company: "Google", date: "Yesterday", status: "Solved" },
    { id: "3", problemName: "Median of Two Sorted Arrays", difficulty: "Hard", company: "Apple", date: "2 days ago", status: "Failed" },
    { id: "4", problemName: "Valid Parentheses", difficulty: "Easy", company: "Meta", date: "3 days ago", status: "Solved" },
    { id: "5", problemName: "Merge Intervals", difficulty: "Medium", company: "Uber", date: "5 days ago", status: "Pending" },
];

export function RecentActivity({ activities = mockActivity }: { activities?: ActivityItem[] }) {
    return (
        <Card className="border-zinc-800 bg-zinc-950/50">
            <CardHeader>
                <CardTitle className="text-lg text-zinc-100">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                            <TableHead className="text-zinc-400">Problem</TableHead>
                            <TableHead className="text-zinc-400">Difficulty</TableHead>
                            <TableHead className="text-zinc-400">Company</TableHead>
                            <TableHead className="text-zinc-400">Status</TableHead>
                            <TableHead className="text-zinc-400 text-right">Last Practiced</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activities.map((activity) => (
                            <TableRow key={activity.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                <TableCell className="font-medium text-zinc-200">{activity.problemName}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={`
                      ${activity.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/10' : ''}
                      ${activity.difficulty === 'Medium' ? 'border-yellow-500/20 text-yellow-500 bg-yellow-500/10' : ''}
                      ${activity.difficulty === 'Hard' ? 'border-red-500/20 text-red-500 bg-red-500/10' : ''}
                    `}
                                    >
                                        {activity.difficulty}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-zinc-400">{activity.company}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {activity.status === 'Solved' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                        {activity.status === 'Failed' && <XCircle className="w-4 h-4 text-red-500" />}
                                        {activity.status === 'Pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                                        <span className="text-zinc-300">{activity.status}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right text-zinc-500">{activity.date}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem className="focus:bg-zinc-800 cursor-pointer">Reconstruct</DropdownMenuItem>
                                            <DropdownMenuItem className="focus:bg-zinc-800 cursor-pointer">View Details</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
