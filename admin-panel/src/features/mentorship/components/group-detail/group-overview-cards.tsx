import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy, UserPlus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo } from 'react';

interface GroupOverviewCardsProps {
  memberCount: number;
  joinCode: string;
  copiedCode: boolean;
  onCopyJoinCode: () => void;
  allowAnonymousJoin: boolean;
}

export const GroupOverviewCards = memo(
  ({
    memberCount,
    joinCode,
    copiedCode,
    onCopyJoinCode,
    allowAnonymousJoin,
  }: GroupOverviewCardsProps) => {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/5 group hover:border-indigo-100/50 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                Cohort Size
              </span>
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 tabular-nums tracking-tight">
              {memberCount}
            </p>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
              Active Members
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/5 group hover:border-indigo-100/50 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                Activation Code
              </span>
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600">
                <Copy className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <code className="text-2xl font-mono font-black text-indigo-600 tracking-extra-wide">
                {joinCode}
              </code>
              <Button
                onClick={onCopyJoinCode}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
              >
                {copiedCode ? (
                  <Check className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
              Security Authorization
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/5 group hover:border-indigo-100/50 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                Anonymous Entry
              </span>
              <div
                className={cn(
                  'p-2 rounded-xl',
                  allowAnonymousJoin
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                <UserPlus className="w-5 h-5" />
              </div>
            </div>
            <p
              className={cn(
                'text-lg font-black uppercase tracking-tight',
                allowAnonymousJoin ? 'text-emerald-600' : 'text-gray-400'
              )}
            >
              {allowAnonymousJoin ? 'ACTIVE PROTOCOL' : 'RESTRICTED'}
            </p>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
              Access Policy
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
);
GroupOverviewCards.displayName = 'GroupOverviewCards';
