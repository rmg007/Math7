import { SkillList } from '../components/skill-list';

export function SkillsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Skills</h1>
                <p className="text-muted-foreground">
                    Manage curriculum skills and learning objectives.
                </p>
            </div>
            <SkillList />
        </div>
    );
}
