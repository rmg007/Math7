import { SkillForm } from '../components/skill-form';

export function SkillCreatePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create Skill</h1>
                <p className="text-muted-foreground">
                    Add a new skill to a domain.
                </p>
            </div>
            <SkillForm />
        </div>
    );
}
