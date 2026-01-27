/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import { usePublishCurriculum } from '../hooks/use-publish';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export function PublishPage() {
    const publishMutation = usePublishCurriculum();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePublish = async () => {
        setSuccess(false);
        setError(null);
        try {
            await publishMutation.mutateAsync();
            setSuccess(true);
        } catch (e: any) {
            setError(e.message || 'Failed to publish');
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Publish Curriculum</h1>
                <p className="text-muted-foreground">
                    Validate integrity and release the latest version to students.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Release New Version</CardTitle>
                    <CardDescription>
                        This will check for data integrity issues (orphaned skills/questions) and bump the curriculum version.
                        Students will receive updates automatically.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {success && (
                        <div className="bg-green-50 text-green-900 p-4 rounded-md flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <p>Curriculum published successfully!</p>
                        </div>
                    )}
                    {error && (
                        <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            <p>{error}</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                     <Button 
                        onClick={handlePublish} 
                        disabled={publishMutation.isPending}
                        className="w-full sm:w-auto"
                    >
                        {publishMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Publish Now
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
