import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Tables } from '@/lib/database.types'
import { StatusBadge, type StatusType } from '@/components/ui/status-badge'
import { Pagination } from '@/components/ui/pagination'
import { AdminHeader } from '@/components/ui/admin-header'
import { Key, Search, X } from 'lucide-react'

type InvitationCode = Tables<'invitation_codes'>

export function InvitationCodesPage() {
  const [codes, setCodes] = useState<InvitationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [maxUses, setMaxUses] = useState("1")
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expiresDays, setExpiresDays] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchCodes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('invitation_codes')
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
        'generate_invitation_code',
        {
          p_max_uses: parseInt(maxUses) || 1,
          p_expires_days: expiresDays ? parseInt(expiresDays) : undefined
        }
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
        'deactivate_invitation_code',
        { p_code_id: codeId }
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
      <AdminHeader 
        title="Invitation Codes"
        description="Generate and manage invitation codes for new admin users."
        icon={Key}
      />

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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search invitation codes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-gray-500 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
              {codes.filter(c => c.code.toLowerCase().includes(searchQuery.toLowerCase())).length} Codes
            </div>
          </div>
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
          <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
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
                {codes
                  .filter(c => c.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize).map((code) => {
                  const isExpired = code.expires_at && new Date(code.expires_at) < new Date()
                  const isExhausted = (code.times_used ?? 0) >= (code.max_uses ?? 1)

                  return (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">
                          {code.code}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const status: StatusType = !code.is_active ? 'inactive' : isExpired ? 'error' : isExhausted ? 'exhausted' : 'active';
                          const label = !code.is_active ? 'Deactivated' : isExpired ? 'Expired' : isExhausted ? 'Exhausted' : 'Active';
                          return <StatusBadge status={status} label={label} />;
                        })()}
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
          {codes.length > 0 && (
             <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(codes.filter(c => c.code.toLowerCase().includes(searchQuery.toLowerCase())).length / pageSize)}
              totalCount={codes.filter(c => c.code.toLowerCase().includes(searchQuery.toLowerCase())).length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          )}
          </>
        )}
      </div>
    </div>
  )
}
