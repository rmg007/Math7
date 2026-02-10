import { useParams } from 'react-router-dom';
import { useSkill } from '../hooks/use-skills';
import { SkillForm } from '../components/skill-form';
import { Loader2 } from 'lucide-react';

export function SkillEditPage() {
    const { id } = useParams<{ id: string }>();
    const { data: skill, isLoading, error } = useSkill(id || '');

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

    return <SkillForm initialData={skill} />;
}
