import { useParams } from 'react-router-dom';
import { useQuestion } from '../hooks/use-questions';
import { QuestionForm } from '../components/question-form';
import { Loader2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export function QuestionEditPage() {
    const { id } = useParams<{ id: string }>();
    const { data: question, isLoading, error } = useQuestion(id || '');

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

    const breadcrumbItems = [
        { label: 'Curriculum', href: '/domains' },
        ...(question.skills?.domains?.subjects ? [{ label: question.skills.domains.subjects.title, href: '/platform/subjects' }] : []),
        ...(question.skills?.domains ? [{ label: question.skills.domains.title, href: `/domains/${question.skills.domains.domain_id}/edit` }] : []),
        ...(question.skills ? [{ label: question.skills.title, href: `/skills/${question.skills.skill_id}/edit` }] : []),
        { label: 'Edit Question' }
    ];

    return (
        <div className="space-y-6">
            <Breadcrumbs items={breadcrumbItems} />
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
