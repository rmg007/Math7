import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import { normalizeString } from '@/lib/normalization';
import { supabase } from '@/lib/supabase';
import { cn, isValidUUID } from '@/lib/utils';
import { ArrowLeft, Home, Loader2, School, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function GroupCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentApp } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<'class' | 'family'>('class');
  const [allowAnonymous, setAllowAnonymous] = useState(false);

  const generateJoinCode = () => {
    // Generate 6-char alphanumeric code (excluding confusing chars like O/0, I/1)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const joinCode = generateJoinCode();

      if (!currentApp) throw new Error('No application context');
      if (!isValidUUID(currentApp.app_id)) throw new Error('Invalid app context ID');

      const { error } = await supabase.from('groups').insert({
        name: normalizeString(name),
        type,
        allow_anonymous_join: allowAnonymous,
        owner_id: user.id,
        join_code: joinCode,
        app_id: currentApp.app_id,
      });

      if (error) throw error;

      toast({
        title: 'Group created',
        description: `Group "${name}" created successfully with code ${joinCode}`,
      });
      navigate('/groups');
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild className="text-indigo-600 hover:bg-indigo-50 -ml-2 mb-2 font-black text-[10px] uppercase tracking-widest gap-2">
          <Link to="/groups">
            <ArrowLeft className="h-4 w-4" />
            Back to Registry
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <AdminHeader
            title="Initialize Squad"
            description="Provision a new pedagogical cluster or domestic learning environment"
            icon={Users}
          />
        </div>
      </div>

      <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/5 overflow-hidden">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  Squad Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={type === 'class' ? 'e.g. Period 4 Geometry' : 'e.g. Smith Family'}
                  className="h-14 bg-white/50 border-indigo-50 text-gray-900 placeholder:text-gray-300 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg font-bold"
                  required
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  Protocol Type
                </Label>
                <RadioGroup
                  value={type}
                  onValueChange={(v) => setType(v as 'class' | 'family')}
                  className="grid grid-cols-2 gap-6"
                >
                  <Label
                    htmlFor="class"
                    className={cn(
                      'flex flex-col items-center justify-center rounded-[2rem] border-2 p-8 cursor-pointer transition-all gap-4 group/radio relative overflow-hidden',
                      type === 'class'
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-xl shadow-indigo-500/10'
                        : 'border-indigo-50/50 bg-white/30 opacity-60 hover:opacity-100 hover:border-indigo-200'
                    )}
                  >
                    <RadioGroupItem value="class" id="class" className="sr-only" />
                    <div className={cn(
                      'p-4 rounded-2xl border transition-all duration-500',
                      type === 'class' ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-white text-indigo-400 border-indigo-50'
                    )}>
                      <School className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <span className="text-base font-black text-gray-900 block tracking-tight">CLASSROOM</span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Academic Cluster</span>
                    </div>
                  </Label>
                  <Label
                    htmlFor="family"
                    className={cn(
                      'flex flex-col items-center justify-center rounded-[2rem] border-2 p-8 cursor-pointer transition-all gap-4 group/radio relative overflow-hidden',
                      type === 'family'
                        ? 'border-purple-500 bg-purple-50/50 shadow-xl shadow-purple-500/10'
                        : 'border-indigo-50/50 bg-white/30 opacity-60 hover:opacity-100 hover:border-indigo-200'
                    )}
                  >
                    <RadioGroupItem value="family" id="family" className="sr-only" />
                    <div className={cn(
                      'p-4 rounded-2xl border transition-all duration-500',
                      type === 'family' ? 'bg-purple-500 text-white border-purple-400' : 'bg-white text-purple-400 border-indigo-50'
                    )}>
                      <Home className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <span className="text-base font-black text-gray-900 block tracking-tight">DOMESTIC</span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Family Unit</span>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between rounded-3xl border border-indigo-50/50 p-6 bg-indigo-50/20">
                <div className="space-y-1">
                  <Label className="text-xs font-black uppercase tracking-widest text-indigo-700">Allow Anonymous Entry</Label>
                  <p className="text-xs text-gray-500 font-bold leading-relaxed max-w-[340px]">
                    Permit students to authorize engagement via Join Code only, bypassing traditional credentialing requirements.
                  </p>
                </div>
                <Switch 
                  checked={allowAnonymous} 
                  onCheckedChange={setAllowAnonymous}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-600/20 transition-all border-0"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                'Provisional Initialize'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
