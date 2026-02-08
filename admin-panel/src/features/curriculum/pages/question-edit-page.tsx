import { useParams } from 'react-router-dom';
import { useQuestion } from '../hooks/use-questions';
import { QuestionForm } from '../components/question-form';
import { Loader2 } from 'lucide-react';

export function QuestionEditPage() {
    const { id } = useParams<{ id: string }>();
    const { data: question, isLoading, error } = useQuestion(id!);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error || !question) {
        return <div>Question not found</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Edit Question</h1>
                <p className="text-muted-foreground">
                    Update question details and answers.
                </p>
            </div>
            <QuestionForm initialData={question} />
        </div>
    );
}
