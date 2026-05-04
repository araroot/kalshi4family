import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield, UserCheck, Flag } from 'lucide-react'
import ApproveButton from './ApproveButton'
import DisputeActions from './DisputeActions'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminProfile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) redirect('/markets')

  const [{ data: pendingUsers }, { data: disputes }, { data: allUsers }] = await Promise.all([
    supabase.from('profiles').select('*').eq('is_approved', false).order('created_at'),
    supabase.from('disputes').select('*, challenger:profiles!challenger_id(id,name), market:markets!market_id(id,title)').eq('status', 'pending').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id,name,email,permanent_points,weekly_points,is_approved,is_admin,created_at').order('created_at'),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-[#818cf8]" />
        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Members', value: allUsers?.length ?? 0 },
          { label: 'Pending Approval', value: pendingUsers?.length ?? 0 },
          { label: 'Open Disputes', value: disputes?.length ?? 0 },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4 text-center">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-[#555] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending approvals */}
      <section className="mb-8">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
          <UserCheck className="w-4 h-4 text-[#22c55e]" />
          Pending Approvals
          {pendingUsers && pendingUsers.length > 0 && (
            <span className="text-xs font-bold text-white bg-[#dc2626] px-1.5 py-0.5 rounded-full">{pendingUsers.length}</span>
          )}
        </h2>
        {!pendingUsers?.length ? (
          <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-6 text-center text-sm text-[#555]">All caught up!</div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map(u => (
              <div key={u.id} className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#2a2a2a] flex items-center justify-center text-sm font-bold text-[#a1a1aa]">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{u.name}</p>
                    <p className="text-xs text-[#555]">{u.email}</p>
                    <p className="text-xs text-[#444] mt-0.5">Signed up {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <ApproveButton userId={u.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Open disputes */}
      <section className="mb-8">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
          <Flag className="w-4 h-4 text-[#f87171]" />
          Open Disputes
        </h2>
        {!disputes?.length ? (
          <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-6 text-center text-sm text-[#555]">No disputes</div>
        ) : (
          <div className="space-y-3">
            {disputes.map((d: any) => (
              <div key={d.id} className="rounded-xl border border-[#7f1d1d]/40 bg-[#450a0a]/10 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">{d.market?.title}</p>
                    <p className="text-xs text-[#a1a1aa] mb-1">Filed by <span className="text-white">{d.challenger?.name}</span></p>
                    <p className="text-xs text-[#555] bg-[#1a1a1a] rounded p-2 mt-1">{d.reason}</p>
                  </div>
                  <DisputeActions disputeId={d.id} marketId={d.market_id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* All members */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-3">All Members</h2>
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#555]">Member</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[#555]">Points</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[#555] hidden sm:table-cell">Status</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[#555] hidden sm:table-cell">Role</th>
              </tr>
            </thead>
            <tbody>
              {allUsers?.map(u => (
                <tr key={u.id} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#141414] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{u.name}</p>
                    <p className="text-xs text-[#555]">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-white tabular-nums">{u.permanent_points.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_approved ? 'text-[#22c55e] bg-[#052e16]/80' : 'text-[#f59e0b] bg-[#451a03]/80'}`}>
                      {u.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_admin ? 'text-[#818cf8] bg-[#1e1b4b]/80' : 'text-[#555] bg-[#1a1a1a]'}`}>
                      {u.is_admin ? 'Admin' : 'Member'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
