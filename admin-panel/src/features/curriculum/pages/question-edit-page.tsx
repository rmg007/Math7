import { useApp } from '@/hooks/use-app';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QuestionForm } from '../components/question-form';
import { useQuestion } from '../hooks/use-questions';

export function QuestionEditPage() {
    const { id } = useParams<{ id: string }>();
    const { data: question, isLoading, error } = useQuestion(id || '');
    const navigate = useNavigate();
    const { currentApp, setCurrentApp, apps, isLoading: isAppLoading } = useApp();
    const [contextError, setContextError] = useState<string | null>(null);

    const isContextSwitching = question && currentApp && question.app_id !== currentApp.app_id && !contextError;

    useEffect(() => {
        if (question && currentApp && question.app_id !== currentApp.app_id && !contextError) {
            const targetApp = apps.find(a => a.app_id === question.app_id);
            if (targetApp) {
                console.log(`[QuestionEditPage] Switching context from ${currentApp.display_name} to ${targetApp.display_name}`);
                setContextError(null);
                setCurrentApp(targetApp);
            } else if (!isAppLoading) {
                console.error(`[QuestionEditPage] Target app ${question.app_id} not found in available apps.`);
                setContextError('The application associated with this question was not found or access is restricted.');
            }
        }
    }, [question, currentApp, apps, setCurrentApp, isAppLoading, contextError]);

    if (isLoading || isAppLoading || isContextSwitching) {
        return (
            <div className="flex flex-col h-[50vh] justify-center items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                    {isContextSwitching ? 'Switching App Context...' : 'Loading Question...'}
                </p>
            </div>
        );
    }

    if (error || contextError || !question) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <h3 className="text-xl font-bold text-red-900">
                    {contextError ? 'Context Access Denied' : 'Question Not Found'}
                </h3>
                <p className="text-muted-foreground max-w-md text-center">
                    {contextError || 'The requested question could not be loaded.'}
                </p>
                {error && <p className="text-xs text-red-500 font-mono bg-red-50 p-2 rounded">{error.message}</p>}
                <button 
                  onClick={() => navigate('/questions')}
                  className="mt-2 px-4 py-2 bg-white border border-red-200 rounded-lg text-red-700 font-bold hover:bg-red-50 transition-colors"
                >
                  Return to Questions
                </button>
            </div>
        );
    }

    return <QuestionForm initialData={question} />;
}
