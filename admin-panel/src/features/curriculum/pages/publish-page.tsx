
import { usePublishCurriculum, usePublishPreview } from '../hooks/use-publish';
import { CheckCircle, AlertTriangle, Upload, BookOpen, Layers, HelpCircle, AlertCircle, Info, Rocket } from 'lucide-react';
import { useState } from 'react';

export function PublishPage() {
    const publishMutation = usePublishCurriculum();
    const { data: preview, isLoading: isLoadingPreview } = usePublishPreview();
    const [success, setSuccess] = useState(false);
    const [publishedVersion, setPublishedVersion] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handlePublish = async () => {
        setSuccess(false);
        setError(null);
        const newVersion = (preview?.meta.version || 0) + 1;
        try {
            await publishMutation.mutateAsync();
            setPublishedVersion(newVersion);
            setSuccess(true);
        } catch (e: unknown) {
            setError((e as Error).message || 'Failed to publish');
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleString();
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Publish Curriculum</h2>
                <p className="mt-1 text-gray-500">
                    Release approved content to make it visible to students.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100">
                            <Info className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Current Version</h3>
                            <p className="text-sm text-gray-500">Live to students</p>
                        </div>
                    </div>
                    {isLoadingPreview ? (
                        <div className="animate-pulse h-12 bg-gray-100 rounded"></div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-purple-600">v{preview?.meta.version || 0}</span>
                                {preview?.canPublish && (
                                    <>
                                        <span className="text-gray-400">→</span>
                                        <span className="text-2xl font-semibold text-green-600">v{(preview?.meta.version || 0) + 1}</span>
                                    </>
                                )}
                            </div>
                            <p className="text-sm text-gray-500">
                                Last published: {formatDate(preview?.meta.last_published_at || null)}
                            </p>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-100">
                            <Rocket className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Live Content</h3>
                            <p className="text-sm text-gray-500">Visible to students</p>
                        </div>
                    </div>
                    {isLoadingPreview ? (
                        <div className="animate-pulse h-12 bg-gray-100 rounded"></div>
                    ) : (
                        <div className="space-y-1">
                            <div className="text-4xl font-bold text-green-600">
                                {preview?.readyToPublishCount || 0}
                            </div>
                            <p className="text-sm text-gray-500">
                                items marked as "Live" are visible to students
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100">
                        <Layers className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Content Status Overview</h3>
                        <p className="text-sm text-gray-500">Current state of all curriculum content</p>
                    </div>
                </div>
                {isLoadingPreview ? (
                    <div className="animate-pulse h-20 bg-gray-100 rounded"></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-2 font-medium text-gray-600">Content</th>
                                    <th className="text-center py-2 font-medium text-gray-500">Draft</th>
                                    <th className="text-center py-2 font-medium text-green-600">Live</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-50">
                                    <td className="py-3 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-gray-400" />
                                        Domains
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                            {preview?.stats.draftDomains || 0}
                                        </span>
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                            {preview?.stats.liveDomains || 0}
                                        </span>
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-50">
                                    <td className="py-3 flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-gray-400" />
                                        Skills
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                            {preview?.stats.draftSkills || 0}
                                        </span>
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                            {preview?.stats.liveSkills || 0}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-3 flex items-center gap-2">
                                        <HelpCircle className="w-4 h-4 text-gray-400" />
                                        Questions
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                            {preview?.stats.draftQuestions || 0}
                                        </span>
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                            {preview?.stats.liveQuestions || 0}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!isLoadingPreview && preview?.validationIssues && preview.validationIssues.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-900">Validation Results</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        {preview.validationIssues.map((issue, index) => (
                            <div 
                                key={index} 
                                className={`flex items-start gap-3 p-3 rounded-xl ${
                                    issue.type === 'error' 
                                        ? 'bg-red-50 border border-red-100' 
                                        : 'bg-amber-50 border border-amber-100'
                                }`}
                            >
                                {issue.type === 'error' ? (
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <p className={`font-medium ${issue.type === 'error' ? 'text-red-800' : 'text-amber-800'}`}>
                                        {issue.type === 'error' ? 'Error' : 'Note'}
                                    </p>
                                    <p className={`text-sm ${issue.type === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
                                        {issue.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500">
                            <Upload className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Curriculum Status</h3>
                            <p className="text-sm text-gray-500">
                                Content with "Live" status is visible to students
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 space-y-4">
                    <p className="text-gray-600">
                        Mark content as "Live" from the domains, skills, or questions lists to make it visible to students. The curriculum version will be incremented when you publish.
                    </p>

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium">Success!</p>
                                <p className="text-sm text-green-700">Curriculum v{publishedVersion} is now live.</p>
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
                        disabled={publishMutation.isPending || isLoadingPreview || !preview?.canPublish}
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
                                {preview?.canPublish 
                                    ? `Publish ${preview.readyToPublishCount} items as v${(preview?.meta.version || 0) + 1}`
                                    : 'Nothing to publish'
                                }
                            </>
                        )}
                    </button>
                    {preview && !preview.canPublish && (
                        <p className="mt-3 text-sm text-gray-500">
                            Mark content as "Live" in the lists to make it visible to students.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
