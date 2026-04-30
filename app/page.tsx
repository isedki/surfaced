import Link from 'next/link'
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold tracking-tight">Surfaced</span>
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm text-zinc-400 hover:text-white transition-colors">Sign in</button>
            </SignInButton>
            <SignInButton mode="modal">
              <button className="text-sm px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors">Get started free</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="text-sm px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors">Dashboard →</Link>
          </SignedIn>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs text-violet-400 border border-violet-900/50 px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Passive capture · No daily logging
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6 tracking-tight">
          Your work is happening.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
            Make sure people know.
          </span>
        </h1>

        <p className="text-zinc-400 text-xl leading-relaxed mb-4 max-w-2xl">
          Surfaced connects to your Calendar and Notion, finds the moments worth communicating, and drafts the right message — so you stop being the best-kept secret in your company.
        </p>
        <p className="text-zinc-600 text-sm mb-12 font-mono">No daily journaling · No effort · Just impact, made visible</p>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-lg transition-all">
              Connect your tools →
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard" className="px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-lg transition-all">
            Go to dashboard →
          </Link>
        </SignedIn>

        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
          {[
            { icon: '📅', title: 'Watches your calendar', body: 'Every meeting, block, and event is context. Surfaced reads what you worked on without you doing anything.' },
            { icon: '✨', title: 'Extracts what matters', body: 'AI identifies the moments worth communicating — shipped features, unblocked teams, decisions made.' },
            { icon: '✉️', title: 'Drafts the right message', body: 'Slack post, manager update, LinkedIn — each draft calibrated to audience and channel. One click to send.' },
          ].map((item, i) => (
            <div key={i} className="border border-white/5 rounded-2xl p-6 bg-white/[0.02]">
              <div className="text-2xl mb-3">{item.icon}</div>
              <div className="font-semibold text-zinc-200 mb-2">{item.title}</div>
              <div className="text-sm text-zinc-500 leading-relaxed">{item.body}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-white/5 py-6 text-center">
        <p className="text-xs text-zinc-700">
          Built by{' '}
          <a href="https://issam-resume.vercel.app" target="_blank" className="hover:text-zinc-500 transition-colors">
            Issam Sedki, PhD — Enterprise Architect & AI Researcher
          </a>
        </p>
      </footer>
    </main>
  )
}
