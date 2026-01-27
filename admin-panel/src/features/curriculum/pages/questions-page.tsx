import { QuestionList } from '../components/question-list';

export function QuestionsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Questions</h1>
                <p className="text-muted-foreground">
                    Manage assessments and practice questions.
                </p>
            </div>
            <QuestionList />
        </div>
    );
}
