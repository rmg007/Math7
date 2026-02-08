import { useState } from 'react';
import { generateQuestionsFromAI } from '@/lib/gemini';
import { useToast } from '@/hooks/use-toast';

export function useAIGenerator() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const generate = async (params: {
        context: string;
        count: number;
        difficulty: string;
        skillTitle: string; 
        promptInstruction?: string;
        questionType?: 'all' | 'multiple_choice' | 'boolean';
    }) => {
        setIsGenerating(true);
        setError(null);

        try {
            const tempInstruction = params.promptInstruction || '';
            // Inject skill context if missing
            const instructionWithSkill = tempInstruction.includes(params.skillTitle) 
                ? tempInstruction 
                : `Focus on the skill/topic: "${params.skillTitle}". ${tempInstruction}`;

            const questions = await generateQuestionsFromAI({
                ...params,
                promptInstruction: instructionWithSkill
            });

            toast({
                title: "Generation Complete",
                description: `Successfully generated ${questions.length} questions.`,
            });
            
            return questions;
        } catch (err) {
            const msg = (err as Error).message;
            setError(msg);
            toast({
                title: "Generation Failed",
                description: msg,
                variant: 'destructive'
            });
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        generate,
        isGenerating,
        error
    };
}
