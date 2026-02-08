import { useParams } from 'react-router-dom';
import { useSkill } from '../hooks/use-skills';
import { SkillForm } from '../components/skill-form';
import { Loader2 } from 'lucide-react';

export function SkillEditPage() {
    const { id } = useParams<{ id: string }>();
    const { data: skill, isLoading, error } = useSkill(id!);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error || !skill) {
        return <div>Skill not found</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Edit Skill</h1>
                <p className="text-muted-foreground">
                    Update skill details.
                </p>
            </div>
            <SkillForm initialData={skill} />
        </div>
    );
}
