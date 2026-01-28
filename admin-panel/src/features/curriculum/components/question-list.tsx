/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from 'react-router-dom';
import { useQuestions, useDeleteQuestion } from '../hooks/use-questions';
import { useSkills } from '../hooks/use-skills';
import { useState } from 'react';
import { Plus, Pencil, Trash, FileText } from 'lucide-react';

export function QuestionList() {
    const [selectedSkillId, setSelectedSkillId] = useState<string>("all");
    const { data: skills } = useSkills();
    const { data: questions, isLoading } = useQuestions(selectedSkillId);
    const deleteQuestion = useDeleteQuestion();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-500">Loading questions...</p>
                </div>
            </div>
        );
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this question?')) {
            await deleteQuestion.mutateAsync(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Questions</h2>
                    <p className="mt-1 text-gray-500">Manage curriculum questions</p>
                </div>
                <Link
                    to="/questions/new"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    <Plus className="h-5 w-5" />
                    New Question
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3 mb-4">
                    <label className="text-sm font-medium text-gray-600">Filter by Skill:</label>
                    <select
                        value={selectedSkillId}
                        onChange={(e) => setSelectedSkillId(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors min-w-[250px]"
                    >
                        <option value="all">All Skills</option>
                        {skills?.map(skill => (
                            <option key={skill.id} value={skill.id}>
                                {skill.title} ({(skill as any).domains?.title})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Content</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Type</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Skill</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Points</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {!questions?.length ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                                <FileText className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 mb-4">No questions found. Create one to get started.</p>
                                            <Link
                                                to="/questions/new"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Create Question
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                questions.map((question: any) => (
                                    <tr key={question.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 max-w-[300px]">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 flex-shrink-0">
                                                    <FileText className="w-5 h-5 text-green-600" />
                                                </div>
                                                <span className="font-medium text-gray-900 truncate">{question.content}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                                                {question.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-700">{question.skills?.title}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-semibold text-sm">
                                                {question.points}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {question.is_published ? (
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
                                                    to={`/questions/${question.id}/edit`}
                                                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(question.id)}
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
