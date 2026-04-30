'use client'
import { useState } from 'react'

interface Draft { id: number; channel: string; content: string; sentAt: string | null }
interface Win   { id: number; title: string; impactSummary: string; audienceHint: string; date: string; drafts: Draft[] }

const CHANNEL_LABELS: Record<string, { label: string; icon: string }> = {
  slack_team: { label: 'Slack Team', icon: '💬' },
  slack_dm:   { label: 'Slack DM', icon: '📩' },
  email:      { label: 'Email', icon: '✉️' },
  linkedin:   { label: 'LinkedIn', icon: '🔵' },
}

export default function WinCard({ win }: { win: Win }) {
  const [activeChannel, setActiveChannel] = useState<string>(win.drafts[0]?.channel ?? '')
  const [copied, setCopied]               = useState(false)

  const activeDraft = win.drafts.find(d => d.channel === activeChannel)

  const copy = () => {
    if (!activeDraft) return
    navigator.clipboard.writeText(activeDraft.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const audienceColors: Record<string, string> = {
    manager: 'text-amber-400 border-amber-900/50 bg-amber-950/20',
    team:    'text-cyan-400 border-cyan-900/50 bg-cyan-950/20',
    public:  'text-violet-400 border-violet-900/50 bg-violet-950/20',
  }

  return (
    <div className="border border-white/5 rounded-2xl p-5 bg-white/[0.02] hover:bg-white/[0.03] transition-colors">
      {/* Win header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm">{win.title}</h3>
            <span className={`text-xs border px-2 py-0.5 rounded-full ${audienceColors[win.audienceHint] ?? audienceColors.team}`}>
              {win.audienceHint}
            </span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">{win.impactSummary}</p>
        </div>
        <span className="text-xs text-zinc-700 flex-shrink-0">
          {new Date(win.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Channel tabs */}
      {win.drafts.length > 0 && (
        <div>
          <div className="flex gap-1 mb-3">
            {win.drafts.map(d => {
              const meta = CHANNEL_LABELS[d.channel] ?? { label: d.channel, icon: '📄' }
              return (
                <button
                  key={d.channel}
                  onClick={() => setActiveChannel(d.channel)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    activeChannel === d.channel
                      ? 'bg-violet-950/40 border border-violet-800/50 text-violet-300'
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  {meta.icon} {meta.label}
                </button>
              )
            })}
          </div>

          {activeDraft && (
            <div className="bg-zinc-950 border border-white/5 rounded-xl p-4 relative">
              <pre className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                {activeDraft.content}
              </pre>
              <button
                onClick={copy}
                className="absolute top-3 right-3 text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
