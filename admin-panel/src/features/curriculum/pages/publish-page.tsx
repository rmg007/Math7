/* eslint-disable @typescript-eslint/no-explicit-any */
import { usePublishCurriculum } from '../hooks/use-publish';
import { CheckCircle, AlertTriangle, Upload } from 'lucide-react';
import { useState } from 'react';

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
                <h2 className="text-3xl font-bold text-gray-900">Publish Curriculum</h2>
                <p className="mt-1 text-gray-500">
                    Validate integrity and release the latest version to students.
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500">
                            <Upload className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Release New Version</h3>
                            <p className="text-sm text-gray-500">
                                Check for data integrity issues and bump the curriculum version
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 space-y-4">
                    <p className="text-gray-600">
                        This will validate all domains, skills, and questions for integrity issues (orphaned records, missing references) and publish a new curriculum version. Students will receive updates automatically.
                    </p>

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium">Success!</p>
                                <p className="text-sm text-green-700">Curriculum published successfully.</p>
                            </div>
                        </div>
                    )}
                    
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="font-medium">Publication Failed</p>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <button 
                        onClick={handlePublish} 
                        disabled={publishMutation.isPending}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {publishMutation.isPending ? (
                            <>
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                                Publishing...
                            </>
                        ) : (
                            <>
                                <Upload className="h-5 w-5" />
                                Publish Now
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
