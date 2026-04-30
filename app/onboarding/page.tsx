'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'

function OnboardingContent() {
  const params  = useSearchParams()
  const router  = useRouter()
  const connected = params.get('connected')
  const error     = params.get('error')

  const [role, setRole]       = useState('')
  const [company, setCompany] = useState('')
  const [goals, setGoals]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [step, setStep]       = useState<'profile' | 'integrations'>('profile')

  const handleProfileSave = async () => {
    setSaving(true)
    await fetch('/api/user/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, company, goals }),
    })
    setSaving(false)
    setStep('integrations')
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <span className="font-semibold text-lg">Surfaced</span>
          <div className="flex items-center gap-2 mt-4">
            {['profile', 'integrations'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${step === s || (i === 0 && step === 'integrations') ? 'bg-violet-500' : 'bg-zinc-700'}`} />
                <span className="text-xs text-zinc-500 capitalize">{s}</span>
                {i === 0 && <span className="text-zinc-700 mx-1">→</span>}
              </div>
            ))}
          </div>
        </div>

        {step === 'profile' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Tell us about you</h1>
              <p className="text-zinc-500 text-sm">So Surfaced knows what impact looks like for your role.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 block mb-1.5">Your role / title</label>
                <input
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="Enterprise Architect, Product Manager, etc."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 block mb-1.5">Company / organisation</label>
                <input
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Your company name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 block mb-1.5">What do you want to be known for?</label>
                <textarea
                  value={goals}
                  onChange={e => setGoals(e.target.value)}
                  placeholder="e.g. AI/LLM expertise, cross-team leadership, strategic architecture decisions…"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                />
              </div>
            </div>
            <button
              onClick={handleProfileSave}
              disabled={!role || saving}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
            >
              {saving ? 'Saving…' : 'Continue →'}
            </button>
          </div>
        )}

        {step === 'integrations' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Connect your tools</h1>
              <p className="text-zinc-500 text-sm">Surfaced reads your activity. No writing required.</p>
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-900/50 rounded-xl px-4 py-3 text-sm text-red-400">
                Connection failed for {error}. Try again.
              </div>
            )}
            {connected && (
              <div className="bg-green-950/30 border border-green-900/50 rounded-xl px-4 py-3 text-sm text-green-400">
                ✓ {connected === 'google' ? 'Google Calendar' : 'Notion'} connected
              </div>
            )}

            <div className="space-y-3">
              {[
                {
                  icon: '📅',
                  name: 'Google Calendar',
                  desc: 'Meetings, blocks, and who you worked with',
                  href: '/api/integrations/connect/google',
                  done: connected === 'google',
                },
                {
                  icon: '📝',
                  name: 'Notion',
                  desc: 'Pages you created or edited',
                  href: '/api/integrations/connect/notion',
                  done: connected === 'notion',
                },
              ].map(item => (
                <a
                  key={item.name}
                  href={item.done ? undefined : item.href}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    item.done
                      ? 'border-green-900/50 bg-green-950/20 cursor-default'
                      : 'border-white/10 bg-white/[0.02] hover:border-violet-500/30 hover:bg-white/5 cursor-pointer'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-zinc-500">{item.desc}</div>
                  </div>
                  {item.done
                    ? <span className="text-green-500 text-sm">✓ Connected</span>
                    : <span className="text-violet-400 text-sm">Connect →</span>
                  }
                </a>
              ))}
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-medium transition-all"
            >
              Go to dashboard →
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

export default function Onboarding() {
  return <Suspense><OnboardingContent /></Suspense>
}
