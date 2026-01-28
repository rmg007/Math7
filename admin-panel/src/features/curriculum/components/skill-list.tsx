/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from 'react-router-dom';
import { useSkills, useDeleteSkill } from '../hooks/use-skills';
import { useDomains } from '../hooks/use-domains';
import { useState } from 'react';
import { Plus, Pencil, Trash, Layers } from 'lucide-react';

export function SkillList() {
    const [selectedDomainId, setSelectedDomainId] = useState<string>("all");
    const { data: skills, isLoading } = useSkills(selectedDomainId === "all" ? undefined : selectedDomainId);
    const { data: domains } = useDomains();
    const deleteSkill = useDeleteSkill();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-500">Loading skills...</p>
                </div>
            </div>
        );
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this skill?')) {
            await deleteSkill.mutateAsync(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Skills</h2>
                    <p className="mt-1 text-gray-500">Manage learning skills</p>
                </div>
                <Link
                    to="/skills/new"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    <Plus className="h-5 w-5" />
                    New Skill
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3 mb-4">
                    <label className="text-sm font-medium text-gray-600">Filter by Domain:</label>
                    <select
                        value={selectedDomainId}
                        onChange={(e) => setSelectedDomainId(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                    >
                        <option value="all">All Domains</option>
                        {domains?.map(domain => (
                            <option key={domain.id} value={domain.id}>{domain.title}</option>
                        ))}
                    </select>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Title</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Domain</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Difficulty</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {!skills?.length ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                                <Layers className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 mb-4">No skills found. Create one to get started.</p>
                                            <Link
                                                to="/skills/new"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Create Skill
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                skills.map((skill: any) => (
                                    <tr key={skill.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50">
                                                    <Layers className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-900">{skill.title}</span>
                                                    <p className="text-sm text-gray-500">{skill.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                                {skill.domains?.title}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm">
                                                {skill.difficulty_level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {skill.is_published ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                    Published
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                                                    Draft
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/skills/${skill.id}/edit`}
                                                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(skill.id)}
                                                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
