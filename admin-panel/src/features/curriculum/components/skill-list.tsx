/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from 'react-router-dom';
import { useSkills, useDeleteSkill } from '../hooks/use-skills';
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
import { useDomains } from '../hooks/use-domains';
import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"


export function SkillList() {
    const [selectedDomainId, setSelectedDomainId] = useState<string>("all");
    
    // Pass undefined if "all" is selected, otherwise pass the ID
    const { data: skills, isLoading } = useSkills(selectedDomainId === "all" ? undefined : selectedDomainId);
    const { data: domains } = useDomains();
    
    const deleteSkill = useDeleteSkill();

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this skill?')) {
            await deleteSkill.mutateAsync(id);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">Skills</h2>
                    <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by Domain" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Domains</SelectItem>
                            {domains?.map(domain => (
                                <SelectItem key={domain.id} value={domain.id}>
                                    {domain.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button asChild>
                    <Link to="/skills/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Skill
                    </Link>
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Domain</TableHead>
                            <TableHead>Difficulty</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!skills?.length ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No skills found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            skills.map((skill: any) => (
                                <TableRow key={skill.id}>
                                    <TableCell className="font-medium">{skill.title}</TableCell>
                                    <TableCell className="text-muted-foreground">{skill.slug}</TableCell>
                                    <TableCell>{skill.domains?.title}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">Level {skill.difficulty_level}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {skill.is_published ? (
                                            <Badge variant="default">Published</Badge>
                                        ) : (
                                            <Badge variant="secondary">Draft</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link to={`/skills/${skill.id}/edit`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(skill.id)}
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
