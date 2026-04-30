'use client'
import { useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import WinCard from './WinCard'

interface Draft { id: number; channel: string; content: string; sentAt: string | null }
interface Win { id: number; title: string; impactSummary: string; audienceHint: string; date: string; drafts: Draft[] }

interface Props {
  wins:               Win[]
  connectedProviders: string[]
  user:               { name?: string; role?: string; company?: string } | null
}

export default function DashboardClient({ wins, connectedProviders, user }: Props) {
  const [syncing, setSyncing]     = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'memory'>('today')

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSyncResult(`Synced: ${data.synced.calendar} calendar events, ${data.synced.notion} Notion pages → ${data.wins} new win${data.wins !== 1 ? 's' : ''} found`)
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      setSyncResult(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const hasIntegrations = connectedProviders.length > 0
  const todayWins = wins.filter(w => {
    const d = new Date(w.date)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  })

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold">Surfaced</span>
          {user?.role && <span className="text-xs text-zinc-600 border border-zinc-800 px-2 py-0.5 rounded-full">{user.role}</span>}
        </div>
        <div className="flex items-center gap-3">
          {connectedProviders.map(p => (
            <span key={p} className="text-xs text-zinc-600">
              {p === 'google' ? '📅' : '📝'} {p === 'google' ? 'Calendar' : 'Notion'}
            </span>
          ))}
          <button
            onClick={handleSync}
            disabled={syncing || !hasIntegrations}
            className="text-sm px-4 py-2 rounded-lg border border-violet-800/50 bg-violet-950/20 text-violet-400 hover:bg-violet-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {syncing ? '⟳ Syncing…' : '↻ Sync now'}
          </button>
          <UserButton />
        </div>
      </nav>

      {syncResult && (
        <div className="mx-6 mt-4 px-4 py-3 bg-green-950/30 border border-green-900/50 rounded-xl text-sm text-green-400">
          {syncResult}
        </div>
      )}

      {/* Setup prompt */}
      {!hasIntegrations && (
        <div className="mx-6 mt-6 p-6 border border-violet-900/30 bg-violet-950/10 rounded-2xl">
          <div className="text-lg font-semibold mb-1">Connect your tools to get started</div>
          <p className="text-zinc-500 text-sm mb-4">Surfaced needs access to your Calendar and Notion to capture your activity.</p>
          <a href="/onboarding" className="inline-block px-6 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium transition-all">
            Connect now →
          </a>
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 pt-6">
        <div className="flex gap-1 border-b border-white/5 mb-6">
          {(['today', 'history', 'memory'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2 border-violet-500 -mb-px'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'today' && (
          <div>
            {todayWins.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-4">🎯</div>
                <p className="text-zinc-500 text-sm">No wins captured today yet.</p>
                <p className="text-zinc-700 text-xs mt-1">Sync now to pull today&apos;s activity.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayWins.map(win => <WinCard key={win.id} win={win} />)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {wins.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-zinc-500 text-sm">No wins yet. Connect your tools and sync.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {wins.map(win => <WinCard key={win.id} win={win} />)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🧠</div>
            <p className="text-zinc-500 text-sm">Your impact story will build here over time.</p>
            <p className="text-zinc-700 text-xs mt-1">Weekly summaries · Monthly narratives · Key themes</p>
          </div>
        )}
      </div>
    </div>
  )
}
