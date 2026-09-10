'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/project'
import { useServiceProject } from '@/services/hooks/useServiceProject'
import {
  HiOutlineSparkles,
  HiOutlineCommandLine,
  HiOutlineBolt,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCpuChip,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlineBugAnt,
  HiOutlineClipboardDocumentCheck,
  HiArrowRight
} from 'react-icons/hi2'
import Link from 'next/link'
import DbCompAiActivity from '@/features/Dashboard/components/DbCompAiActivity'

export default function AiHubPage() {
  const params = useParams()
  const router = useRouter()
  const orgName = (params?.orgName as string) || ''
  const { projects } = useProjectStore()
  useServiceProject()

  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [promptText, setPromptText] = useState('')

  // Default to first project if none selected
  const activeProjectId = selectedProjectId || (projects.length > 0 ? projects[0].id : '')

  const handleExecutePrompt = (e: React.FormEvent) => {
    e.preventDefault()
    if (!promptText.trim() || !activeProjectId) return

    // Navigate directly into the WhatsApp project chat with the command
    router.push(`/${orgName}?p=${activeProjectId}`)
  }

  const handleLaunchAgent = (commandPrefix: string) => {
    if (!activeProjectId) {
      router.push(`/${orgName}`)
      return
    }
    router.push(`/${orgName}?p=${activeProjectId}`)
  }

  const agents = [
    {
      id: 'task-architect',
      name: 'Task Master Agent',
      handle: '@bot /Task',
      role: 'Autonomous Work Breakdown',
      desc: 'Breaks down complex requirements into structured tasks, assigns priorities, estimates story points, and sets smart deadlines.',
      icon: HiOutlineClipboardDocumentCheck,
      color: 'from-indigo-500 to-indigo-700',
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
      sample: '/Task @bot Design onboarding flow priority: high points: 5 due: friday'
    },
    {
      id: 'bug-hunter',
      name: 'Defect Hunter Agent',
      handle: '@bot /Bug',
      role: 'Triage & Resolution',
      desc: 'Triages bug reports from logs or descriptions, assigns critical tags, and assigns the best matching engineer.',
      icon: HiOutlineBugAnt,
      color: 'from-rose-500 to-rose-700',
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
      sample: '/Bug @bot 403 authorization error during token refresh priority: urgent'
    },
    {
      id: 'comms-agent',
      name: 'Outbound Comms Agent',
      handle: '@bot /Email',
      role: 'Client & Stakeholder Updates',
      desc: 'Drafts concise, context-aware stakeholder updates, release notes, and milestone emails using live project status data.',
      icon: HiOutlineEnvelope,
      color: 'from-amber-500 to-amber-700',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
      sample: '/Email @bot Send sprint completion update to client executive'
    },
    {
      id: 'cron-agent',
      name: 'Workflow Automator Agent',
      handle: '@bot /Schedule',
      role: 'Scheduled Jobs & Alerts',
      desc: 'Automates recurring project health digests, stale task warnings, and deadline countdown reminders.',
      icon: HiOutlineClock,
      color: 'from-purple-500 to-purple-700',
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      sample: '/Schedule @bot check overdue tasks every day at 9am'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-white p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 p-6 sm:p-10 border border-indigo-500/20 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
            <HiOutlineSparkles className="w-4 h-4 text-indigo-400" />
            AI Autonomous Workspace
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            AI Operations Hub
          </h1>
          <p className="text-sm sm:text-base text-indigo-200/90 leading-relaxed">
            Manage your entire CRM with natural language. Chat with dedicated AI agents across projects to automate tasks, triage bugs, and generate communications.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href={`/${orgName}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30"
            >
              <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
              Open WhatsApp Chat Interface
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Omnibar / Command Center Console */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-200/80 dark:border-gray-800/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineCommandLine className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Instant Command Dispatcher
            </h2>
          </div>

          {/* Project Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 hidden sm:inline">Target Project:</label>
            <select
              value={activeProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs rounded-xl bg-gray-100 dark:bg-gray-800 border-0 px-3 py-1.5 text-gray-800 dark:text-gray-200 font-medium focus:ring-2 focus:ring-indigo-500/40"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={handleExecutePrompt} className="relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. /Task @bot Create user authentication API with refresh tokens priority: urgent..."
              className="w-full pl-4 pr-28 py-3.5 text-xs sm:text-sm rounded-xl bg-gray-100/80 dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 border-0 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Execute</span>
              <HiOutlineBolt className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Autonomous AI Agents Roster */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Available AI Specialists
            </h2>
            <p className="text-xs text-gray-400">
              Each agent specializes in a distinct CRM automation discipline
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => {
            const Icon = agent.icon
            return (
              <div
                key={agent.id}
                className="group relative bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-800/80 shadow-xs hover:border-indigo-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${agent.color} flex items-center justify-center text-white shadow-md`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                          {agent.name}
                        </h3>
                        <span className="text-[11px] text-gray-400">
                          {agent.role}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${agent.badgeColor}`}
                    >
                      {agent.handle}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                    {agent.desc}
                  </p>

                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 font-mono text-[11px] text-gray-600 dark:text-gray-300 truncate">
                    {agent.sample}
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    Always Listening
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLaunchAgent(agent.handle)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    <span>Use in Chat</span>
                    <HiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* AI Activity Feed */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Live AI Automation Feed
        </h2>
        <DbCompAiActivity />
      </div>
    </div>
  )
}
