/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from 'react-router-dom';
import { useQuestions, useDeleteQuestion } from '../hooks/use-questions';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash } from 'lucide-react';
import { useSkills } from '../hooks/use-skills';
import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function QuestionList() {
    const [selectedSkillId, setSelectedSkillId] = useState<string>("all");
    
    // Fetch all skills for filter dropdown
    const { data: skills } = useSkills();
    
    const { data: questions, isLoading } = useQuestions(selectedSkillId);
    
    const deleteQuestion = useDeleteQuestion();

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this question?')) {
            await deleteQuestion.mutateAsync(id);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">Questions</h2>
                    <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Filter by Skill" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Skills</SelectItem>
                            {skills?.map(skill => (
                                <SelectItem key={skill.id} value={skill.id}>
                                    {skill.title} ({(skill as any).domains?.title})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button asChild>
                    <Link to="/questions/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
                    </Link>
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[400px]">Content</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Skill</TableHead>
                            <TableHead>Points</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!questions?.length ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No questions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            questions.map((question: any) => (
                                <TableRow key={question.id}>
                                    <TableCell className="font-medium truncate max-w-[400px]">
                                        {question.content}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{question.type}</Badge>
                                    </TableCell>
                                    <TableCell>{question.skills?.title}</TableCell>
                                    <TableCell>{question.points}</TableCell>
                                    <TableCell>
                                        {question.is_published ? (
                                            <Badge variant="default">Published</Badge>
                                        ) : (
                                            <Badge variant="secondary">Draft</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link to={`/questions/${question.id}/edit`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(question.id)}
                                            >
                                                <Trash className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
