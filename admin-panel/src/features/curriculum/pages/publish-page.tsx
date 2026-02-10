import { usePublishCurriculum, usePublishPreview } from '../hooks/use-publish';
import { CheckCircle, AlertTriangle, Upload, BookOpen, Layers, HelpCircle, AlertCircle, Rocket, Send, Activity, ShieldCheck, History } from 'lucide-react';
import { useState } from 'react';
import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/use-app';
import { Skeleton } from '@/components/ui/skeleton';

export function PublishPage() {
    const { currentApp } = useApp();
    const publishMutation = usePublishCurriculum();
    const { data: preview, isLoading: isLoadingPreview, isError: isErrorPreview, error: previewError } = usePublishPreview();
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
        if (!dateStr) return 'No prior releases';
        return new Date(dateStr).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
            <AdminHeader 
                title="Curriculum Release"
                description="Finalize and deploy approved content to the production environment."
                icon={Send}
                breadcrumbs={[
                    { label: 'Curriculum', href: '/domains' },
                    { label: 'Release', href: '/publish' }
                ]}
                actions={
                    <Button asChild variant="outline" className="rounded-2xl border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 transition-all font-bold uppercase tracking-widest text-[10px] h-12">
                        <Link to="/versions">
                            <History className="mr-2 h-4 w-4" />
                            View History
                        </Link>
                    </Button>
                }
            />

            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/20 p-8 hover:shadow-xl transition-all duration-500 group">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/10 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Active Protocol</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Current live version</p>
                        </div>
                    </div>
                    {isLoadingPreview ? (
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-1/3 rounded-xl" />
                            <Skeleton className="h-4 w-2/3 rounded-lg" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-baseline gap-3">
                                <span className="text-5xl font-black text-purple-600 tracking-tighter">v{preview?.meta.version || 0}</span>
                                {preview?.canPublish && (
                                    <>
                                        <div className="animate-pulse">
                                            <span className="text-gray-300 font-light text-2xl">→</span>
                                        </div>
                                        <span className="text-3xl font-black text-emerald-600 tracking-tight opacity-50">v{(preview?.meta.version || 0) + 1}</span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-gray-300" />
                                <p className="text-xs font-bold text-gray-500">
                                    Last Release: <span className="text-gray-900 font-black">{formatDate(preview?.meta.last_published_at || null)}</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/20 p-8 hover:shadow-xl transition-all duration-500 group">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/10 group-hover:scale-110 transition-transform">
                            <Rocket className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Stage Manifest</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Pending deployments</p>
                        </div>
                    </div>
                    {isLoadingPreview ? (
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-1/4 rounded-xl" />
                            <Skeleton className="h-4 w-1/2 rounded-lg" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="text-5xl font-black text-emerald-600 tracking-tighter">
                                {preview?.readyToPublishCount || 0}
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                Items Staged for Production
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-[3rem] shadow-sm border border-white/20 p-1 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/10">
                            <Layers className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Integrity Matrix</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Entity verification</p>
                        </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-gray-200" />
                </div>

                {isLoadingPreview ? (
                    <div className="p-8 space-y-4">
                        <Skeleton className="h-12 w-full rounded-2xl" />
                        <Skeleton className="h-12 w-full rounded-2xl" />
                        <Skeleton className="h-12 w-full rounded-2xl" />
                    </div>
                ) : (
                    <div className="overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="text-left px-8 py-5 font-black text-gray-400 text-[10px] uppercase tracking-widest">Entity Signature</th>
                                    <th className="text-center px-4 py-5 font-black text-gray-400 text-[10px] uppercase tracking-widest">Staging Environment</th>
                                    <th className="text-center px-8 py-5 font-black text-gray-400 text-[10px] uppercase tracking-widest">Production Baseline</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <tr className="group hover:bg-purple-50/30 transition-colors">
                                    <td className="px-8 py-6 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                            <BookOpen className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <span className="font-bold text-gray-800 text-lg tracking-tight">Domains</span>
                                    </td>
                                    <td className="px-4 py-6 text-center">
                                        <span className="inline-flex items-center px-4 py-2 bg-gray-100/50 text-gray-900 rounded-xl text-sm font-black border border-gray-200/50 tracking-tighter shadow-sm">
                                            {preview?.stats.draftDomains || 0}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="inline-flex items-center px-4 py-2 bg-emerald-500/10 text-emerald-700 rounded-xl text-sm font-black border border-emerald-500/20 tracking-tighter shadow-sm">
                                            {preview?.stats.liveDomains || 0}
                                        </span>
                                    </td>
                                </tr>
                                <tr className="group hover:bg-blue-50/30 transition-colors">
                                    <td className="px-8 py-6 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <Layers className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <span className="font-bold text-gray-800 text-lg tracking-tight">Skills</span>
                                    </td>
                                    <td className="px-4 py-6 text-center">
                                        <span className="inline-flex items-center px-4 py-2 bg-gray-100/50 text-gray-900 rounded-xl text-sm font-black border border-gray-200/50 tracking-tighter shadow-sm">
                                            {preview?.stats.draftSkills || 0}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="inline-flex items-center px-4 py-2 bg-emerald-500/10 text-emerald-700 rounded-xl text-sm font-black border border-emerald-500/20 tracking-tighter shadow-sm">
                                            {preview?.stats.liveSkills || 0}
                                        </span>
                                    </td>
                                </tr>
                                <tr className="group hover:bg-amber-50/30 transition-colors">
                                    <td className="px-8 py-6 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                            <HelpCircle className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <span className="font-bold text-gray-800 text-lg tracking-tight">Questions</span>
                                    </td>
                                    <td className="px-4 py-6 text-center">
                                        <span className="inline-flex items-center px-4 py-2 bg-gray-100/50 text-gray-900 rounded-xl text-sm font-black border border-gray-200/50 tracking-tighter shadow-sm">
                                            {preview?.stats.draftQuestions || 0}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="inline-flex items-center px-4 py-2 bg-emerald-500/10 text-emerald-700 rounded-xl text-sm font-black border border-emerald-500/20 tracking-tighter shadow-sm">
                                            {preview?.stats.liveQuestions || 0}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isErrorPreview && (
                 <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 text-red-900 p-8 rounded-[2.5rem] shadow-sm flex items-center gap-6 animate-in shake duration-500">
                    <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/10">
                        <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-gray-900 tracking-tight">Sync Disrupted</p>
                        <p className="text-sm font-bold text-red-700/80 leading-relaxed uppercase tracking-tight">
                            {(previewError as Error)?.message || 'Check your connection or administrative authority'}
                        </p>
                    </div>
                </div>
            )}

            {!isLoadingPreview && preview?.validationIssues && preview.validationIssues.length > 0 && (
                <div className="bg-white/70 backdrop-blur-xl rounded-[3rem] shadow-sm border border-white/20 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 bg-amber-500/5 flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-amber-500/10">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Pre-flight Intelligence</h3>
                    </div>
                    <div className="p-8 space-y-4">
                        {preview.validationIssues.map((issue, index) => (
                            <div 
                                key={index} 
                                className={cn(
                                    "flex items-start gap-4 p-5 rounded-2xl border transition-all hover:scale-[1.01]",
                                    issue.type === 'error' 
                                        ? 'bg-red-500/5 border-red-500/10 text-red-900 shadow-sm' 
                                        : 'bg-amber-500/5 border-amber-500/10 text-amber-900 shadow-sm'
                                )}
                            >
                                <div className={cn(
                                    "p-3 rounded-xl",
                                    issue.type === 'error' ? 'bg-red-500/10' : 'bg-amber-500/10'
                                )}>
                                    {issue.type === 'error' ? (
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                    ) : (
                                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="font-black text-sm tracking-widest uppercase">
                                        {issue.type === 'error' ? 'Critical Blocker' : 'Optimization Notice'}
                                    </p>
                                    <p className="text-base font-semibold opacity-90 leading-relaxed tracking-tight">
                                        {issue.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white/70 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden group">
                <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-transparent">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 shadow-xl shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-500">
                            <Upload className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Production Handover</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Authorized synchronization</p>
                        </div>
                    </div>
                </div>
                
                <div className="p-10 space-y-8">
                    <div className="bg-indigo-50/50 border border-indigo-100/50 p-6 rounded-[2rem]">
                        <p className="text-gray-600 font-medium leading-relaxed tracking-tight">
                            Executing this trigger will synchronize all <span className="text-emerald-600 font-black italic">"Live"</span> entities for <span className="font-black text-gray-900">{currentApp?.display_name || 'the active context'}</span>. 
                            This action is permanent and will be logged in the immutable release ledger. 
                            Students will receive this update on their next pulse-check.
                        </p>
                    </div>

                    {success && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 p-6 rounded-[2rem] flex items-center gap-6 animate-in zoom-in-95 duration-500 shadow-lg shadow-emerald-500/5">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 animate-bounce shadow-lg shadow-emerald-500/20">
                                <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-xl font-black tracking-tight">Deployment Succeeded</p>
                                <p className="text-sm font-bold text-emerald-700/80 uppercase tracking-widest">Protocol v{publishedVersion} is now globally active.</p>
                            </div>
                        </div>
                    )}
                    
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-900 p-6 rounded-[2rem] flex items-center gap-6 animate-in shake duration-500 shadow-lg shadow-red-500/5">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 flex-shrink-0 shadow-lg shadow-red-500/20">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-xl font-black tracking-tight">Execution Aborted</p>
                                <p className="text-sm font-bold text-red-700/80 uppercase tracking-widest">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 pl-4">System State:</span>
                        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
                             <div className={cn(
                                 "w-2.5 h-2.5 rounded-full shadow-sm",
                                 preview?.canPublish ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
                             )}></div>
                             <span className="text-xs font-black text-gray-700 uppercase tracking-widest">
                                 {preview?.canPublish ? 'Ready for Deployment' : 'No Changes Detected'}
                             </span>
                        </div>
                    </div>

                    <button 
                        onClick={handlePublish} 
                        disabled={publishMutation.isPending || isLoadingPreview || !preview?.canPublish}
                        className="group relative inline-flex items-center gap-4 px-12 py-5 bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black rounded-[1.5rem] transition-all duration-300 shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/40 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed transform active:scale-95 overflow-hidden"
                    >
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-100%] group-hover:translate-x-[100%] duration-1000"></div>
                        
                        {publishMutation.isPending ? (
                            <>
                                <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-white border-r-transparent"></div>
                                <span className="text-sm uppercase tracking-[0.2em]">Executing Handover...</span>
                            </>
                        ) : (
                            <>
                                <Upload className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />
                                <span className="text-sm uppercase tracking-[0.2em]">
                                    {preview?.canPublish 
                                        ? `Push ${preview.readyToPublishCount} Entities to Live`
                                        : 'Awaiting Staging'
                                    }
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
