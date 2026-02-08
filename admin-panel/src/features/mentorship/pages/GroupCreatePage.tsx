import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Loader2, School, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function GroupCreatePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [name, setName] = useState('')
  const [type, setType] = useState<'class' | 'family'>('class')
  const [allowAnonymous, setAllowAnonymous] = useState(false)

  const generateJoinCode = () => {
    // Generate 6-char alphanumeric code (excluding confusing chars like O/0, I/1)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Not authenticated")

        const joinCode = generateJoinCode() 

        const { error } = await supabase.from('groups').insert({
            name,
            type,
            allow_anonymous_join: allowAnonymous,
            owner_id: user.id,
            join_code: joinCode,
        })

        if (error) throw error

        toast({
            title: "Group created",
            description: `Group "${name}" created successfully with code ${joinCode}`,
        })
        navigate('/groups')
    } catch (err: unknown) {
        const error = err as Error
        toast({
            title: "Error",
            description: error.message,
            variant: "destructive"
        })
    } finally {
        setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="text-slate-600 hover:bg-slate-100">
                <Link to="/groups">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Create New Group</h1>
                <p className="text-slate-600">Set up a new class or family group.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
            <div className="space-y-6">
                <div className="space-y-3">
                    <Label htmlFor="name" className="text-slate-900 text-base">Group Name</Label>
                    <Input 
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={type === 'class' ? "e.g. Period 4 Geometry" : "e.g. Smith Family"}
                        className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 h-12 text-lg"
                        required
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-slate-900 text-base">Group Type</Label>
                    <RadioGroup value={type} onValueChange={(v) => setType(v as 'class' | 'family')} className="grid grid-cols-2 gap-4">
                        <Label
                            htmlFor="class"
                            className={cn(
                                "flex flex-col items-center justify-between rounded-xl border-2 p-6 hover:bg-slate-50 cursor-pointer transition-all gap-4",
                                type === 'class' ? "border-blue-500 bg-blue-50 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "border-slate-200 bg-white opacity-60 hover:opacity-100"
                            )}
                        >
                            <RadioGroupItem value="class" id="class" className="sr-only" />
                            <School className={cn("h-10 w-10", type === 'class' ? "text-blue-500" : "text-slate-400")} />
                            <div className="text-center">
                                <span className="text-lg font-bold text-slate-900 block">Classroom</span>
                                <span className="text-xs text-slate-500">For teachers & students</span>
                            </div>
                        </Label>
                        <Label
                            htmlFor="family"
                            className={cn(
                                "flex flex-col items-center justify-between rounded-xl border-2 p-6 hover:bg-slate-50 cursor-pointer transition-all gap-4",
                                type === 'family' ? "border-purple-500 bg-purple-50 shadow-[0_0_20px_rgba(168,85,247,0.1)]" : "border-slate-200 bg-white opacity-60 hover:opacity-100"
                            )}
                        >
                            <RadioGroupItem value="family" id="family" className="sr-only" />
                            <Home className={cn("h-10 w-10", type === 'family' ? "text-purple-500" : "text-slate-400")} />
                            <div className="text-center">
                                <span className="text-lg font-bold text-slate-900 block">Family</span>
                                <span className="text-xs text-slate-500">For parents & kids</span>
                            </div>
                        </Label>
                    </RadioGroup>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-5 bg-slate-50">
                    <div className="space-y-1">
                        <Label className="text-base text-slate-900">Allow Anonymous Students</Label>
                        <p className="text-sm text-slate-600 max-w-[300px]">If enabled, students can join your group simply by entering the Join Code, without needing an email address.</p>
                    </div>
                    <Switch
                        checked={allowAnonymous}
                        onCheckedChange={setAllowAnonymous}
                    />
                </div>
            </div>

            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-400 hover:to-blue-500 text-lg font-semibold shadow-lg shadow-purple-500/25 border-0">
                {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Create Group
            </Button>
        </form>
    </div>
  )
}
