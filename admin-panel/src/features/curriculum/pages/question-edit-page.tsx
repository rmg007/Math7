import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { QuestionForm } from '../components/question-form';
import { useQuestion } from '../hooks/use-questions';

export function QuestionEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data: question, isLoading, error } = useQuestion(id || '');
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex flex-col h-[50vh] justify-center items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading Question...
        </p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h3 className="text-xl font-bold text-red-900">Question Not Found</h3>
        <p className="text-muted-foreground max-w-md text-center">
          The requested question could not be loaded.
        </p>
        {error && (
          <p className="text-xs text-red-500 font-mono bg-red-50 p-2 rounded">{error.message}</p>
        )}
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
