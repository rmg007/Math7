import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface InvitationCode {
  id: string
  code: string
  created_by: string | null
  expires_at: string | null
  max_uses: number
  times_used: number
  is_active: boolean
  created_at: string
}

export function InvitationCodesPage() {
  const [codes, setCodes] = useState<InvitationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [maxUses, setMaxUses] = useState("1")
  const [expiresDays, setExpiresDays] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchCodes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('invitation_codes' as never)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError('Failed to load invitation codes')
      console.error(error)
    } else {
      setCodes((data as InvitationCode[]) || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCodes()
  }, [])

  const handleGenerateCode = async () => {
    setGenerating(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: newCode, error: genError } = await supabase.rpc(
        'generate_invitation_code' as never,
        {
          p_max_uses: parseInt(maxUses) || 1,
          p_expires_days: expiresDays ? parseInt(expiresDays) : null
        } as never
      )

      if (genError) throw genError

      setSuccess(`New invitation code generated: ${newCode}`)
      await fetchCodes()
      setMaxUses("1")
      setExpiresDays("")
    } catch (err) {
      setError('Failed to generate invitation code. Make sure you are a super admin.')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const handleDeactivateCode = async (codeId: string) => {
    try {
      const { error: deactError } = await supabase.rpc(
        'deactivate_invitation_code' as never,
        { p_code_id: codeId } as never
      )

      if (deactError) throw deactError

      await fetchCodes()
    } catch (err) {
      setError('Failed to deactivate code')
      console.error(err)
    }
  }

  const handleCopyCode = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(codeId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Invitation Codes
        </h1>
        <p className="text-gray-500 mt-1">
          Generate and manage invitation codes for new admin users
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New Code</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Max Uses</label>
            <Input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="w-32"
              placeholder="1"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Expires In (days)</label>
            <Input
              type="number"
              min="1"
              value={expiresDays}
              onChange={(e) => setExpiresDays(e.target.value)}
              className="w-32"
              placeholder="Never"
            />
          </div>
          <Button
            onClick={handleGenerateCode}
            disabled={generating}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            {generating ? 'Generating...' : 'Generate Code'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">All Invitation Codes</h2>
        </div>
        
        {codes.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No invitation codes yet. Generate your first code above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {codes.map((code) => {
                  const isExpired = code.expires_at && new Date(code.expires_at) < new Date()
                  const isExhausted = code.times_used >= code.max_uses
                  const isUsable = code.is_active && !isExpired && !isExhausted

                  return (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">
                          {code.code}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          isUsable
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {!code.is_active ? 'Deactivated' : isExpired ? 'Expired' : isExhausted ? 'Exhausted' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {code.times_used} / {code.max_uses}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(code.expires_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(code.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCode(code.code, code.id)}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          {copiedId === code.id ? 'Copied!' : 'Copy'}
                        </Button>
                        {code.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivateCode(code.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Deactivate
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
