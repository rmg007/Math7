import { QuestionForm } from '../components/question-form';

export function QuestionCreatePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create Question</h1>
                <p className="text-muted-foreground">
                    Add a new question to a skill.
                </p>
            </div>
            <QuestionForm />
        </div>
    );
}
