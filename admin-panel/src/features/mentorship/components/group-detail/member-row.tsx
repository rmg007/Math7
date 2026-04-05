import { Link } from 'react-router-dom';
import { Edit3, Trash2 } from 'lucide-react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';

export interface Member {
  group_id: string;
  is_anonymous: boolean | null;
  joined_at: string;
  nickname: string | null;
  user_id: string;
  profiles: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

interface MemberRowProps {
  member: Member;
  onEdit: (id: string, nickname: string) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
  editNickname: string;
  onNicknameChange: (val: string) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const MemberRow = memo(
  ({
    member,
    onEdit,
    onRemove,
    isEditing,
    editNickname,
    onNicknameChange,
    onSave,
    onCancel,
    isPending,
  }: MemberRowProps) => {
    const displayName =
      member.nickname || member.profiles?.full_name || member.profiles?.email || 'Anonymous User';
    const isAnonymous = !member.user_id || !member.profiles?.email;

    return (
      <div className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-all group">
        <div className="flex items-center gap-4 flex-1">
          <div className="h-10 w-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => onNicknameChange(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded text-gray-900 text-sm font-medium focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 w-full max-w-[200px]"
                  placeholder="Enter nickname"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && member.user_id) onSave(member.user_id);
                    if (e.key === 'Escape') onCancel();
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  className="h-8 rounded-lg font-bold text-2xs uppercase tracking-widest"
                  onClick={() => member.user_id && onSave(member.user_id)}
                  disabled={isPending || !member.user_id}
                >
                  Save
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/students/${member.user_id}`}
                    className="font-bold text-gray-900 text-sm leading-tight hover:text-teal-600 transition-colors"
                  >
                    {displayName}
                  </Link>
                  {isAnonymous && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold uppercase">
                      Anon
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {member.profiles?.email && (
                    <p className="text-xs text-gray-400 font-semibold">{member.profiles.email}</p>
                  )}
                  <span className="text-xs text-gray-300">•</span>
                  <p className="text-xs text-gray-400 font-semibold">
                    {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Active'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => member.user_id && onEdit(member.user_id, member.nickname || '')}
              className="h-7 w-7 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => member.user_id && onRemove(member.user_id)}
              className="h-7 w-7 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    );
  }
);
MemberRow.displayName = 'MemberRow';
