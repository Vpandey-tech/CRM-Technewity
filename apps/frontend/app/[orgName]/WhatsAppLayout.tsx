'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useProjectStore } from '@/store/project'
import { useServiceProject } from '@/services/hooks/useServiceProject'
import { useTodoCounter } from '@/hooks/useTodoCounter'
import { useProjectPinUnpin } from '@/hooks/useProjectPinUnPin'
import { useGlobalDataStore } from '@/store/global'
import { Project } from '@prisma/client'
import ProjectContactItem from '@/features/ProjectChat/ProjectContactItem'
import ChatFullScreen from '@/features/ProjectChat/ChatFullScreen'
import NotificationBell from '@/features/NotificationCenter/NotificationBell'
import ProjectAddModal from '@/features/Project/Add/ProjectAddModal'
import {
  HiMagnifyingGlass,
  HiPlus,
  HiOutlineBriefcase,
  HiOutlineChartBarSquare,
  HiOutlineSquares2X2,
  HiOutlineChatBubbleLeftRight
} from 'react-icons/hi2'
import Link from 'next/link'

export default function WhatsAppLayout() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orgName = (params?.orgName as string) || ''

  // Project state
  const { projects, loading, selectedProject, selectProject } = useProjectStore()
  const { todoCounter } = useTodoCounter()
  const { pinnedProjects } = useProjectStore()
  const { extractPinNUnpinProjects } = useProjectPinUnpin()

  // Ensure projects are loaded
  useServiceProject()

  // Search & tab filter
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'pinned'>('all')

  // Selected project ID from URL query ?p=... or store
  const currentProjectIdFromQuery = searchParams.get('p')

  // Active project object
  const activeProject = useMemo(() => {
    if (currentProjectIdFromQuery) {
      const found = projects.find((p) => p.id === currentProjectIdFromQuery)
      if (found) return found
    }
    return selectedProject || (projects.length > 0 ? projects[0] : null)
  }, [currentProjectIdFromQuery, selectedProject, projects])

  // Mobile view state: whether chat is open full-screen on small devices
  // Default to true on mobile so mobile users land directly in Chat CRM
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(true)

  // Automatically select the active project in store if not yet selected
  useEffect(() => {
    if (activeProject && (!selectedProject || selectedProject.id !== activeProject.id)) {
      selectProject(activeProject.id)
    }
  }, [activeProject, selectedProject, selectProject])

  // If loading finished and there are zero projects, open project list on mobile
  useEffect(() => {
    if (!loading && projects.length === 0) {
      setIsMobileChatOpen(false)
    }
  }, [loading, projects.length])

  // Sync with query param on initial load
  useEffect(() => {
    if (currentProjectIdFromQuery) {
      setIsMobileChatOpen(true)
      const matched = projects.find((p) => p.id === currentProjectIdFromQuery)
      if (matched) {
        selectProject(matched.id)
      }
    }
  }, [currentProjectIdFromQuery, projects, selectProject])

  const handleSelectProject = (project: Project) => {
    selectProject(project.id)
    setIsMobileChatOpen(true)
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('p', project.id)
    router.push(`/${orgName}?${newParams.toString()}`)
  }

  const handleBackToProjectsMobile = () => {
    setIsMobileChatOpen(false)
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.delete('p')
    router.push(`/${orgName}`)
  }

  const { pin } = extractPinNUnpinProjects(projects, pinnedProjects)

  // Filtered project list
  const filteredProjects = useMemo(() => {
    let list = projects || []
    if (activeFilter === 'pinned') {
      const pinnedIds = new Set(pin.map((p) => p.id))
      list = list.filter((p) => pinnedIds.has(p.id))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.desc && p.desc.toLowerCase().includes(q))
      )
    }
    return list
  }, [projects, activeFilter, searchQuery, pin])

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-white dark:bg-gray-950 font-sans">
      {/* LEFT COLUMN: WhatsApp Contact List (Projects) */}
      <aside
        className={`w-full md:w-80 lg:w-96 shrink-0 h-full border-r border-gray-200/80 dark:border-gray-800/80 flex flex-col bg-gray-50/50 dark:bg-gray-900/60 backdrop-blur-xl transition-all duration-300 z-30 ${
          isMobileChatOpen ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Org Top Bar */}
        <div className="h-16 px-4 border-b border-gray-200/80 dark:border-gray-800/80 flex items-center justify-between shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20 shrink-0">
              {orgName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {orgName}
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Workspace CRM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Create Project Modal */}
            <ProjectAddModal
              triggerComponent={
                <button
                  type="button"
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                  title="Create New Project"
                >
                  <HiPlus className="w-4 h-4" />
                </button>
              }
            />
          </div>
        </div>

        {/* Quick Nav Links (My Works, Dashboard) */}
        <div className="px-3 pt-3 pb-2 flex items-center gap-1.5 border-b border-gray-200/60 dark:border-gray-800/60 overflow-x-auto shrink-0 scrollbar-none">
          <Link
            href={`/${orgName}/my-works`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <HiOutlineBriefcase className="w-4 h-4 text-indigo-500" />
            My Works
          </Link>
          <Link
            href={`/${orgName}/dashboard`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <HiOutlineChartBarSquare className="w-4 h-4 text-emerald-500" />
            Dashboard
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 border-b border-gray-200/60 dark:border-gray-800/60 shrink-0 space-y-2">
          <div className="relative">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects or chat..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-100/90 dark:bg-gray-800/90 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 transition-all border-0"
            />
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                activeFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-gray-200/60 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              All Projects ({projects.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('pinned')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                activeFilter === 'pinned'
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-gray-200/60 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              Pinned ({pin.length})
            </button>
          </div>
        </div>

        {/* Project Contact Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading && projects.length === 0 && (
            <div className="p-6 text-center text-xs text-gray-400 animate-pulse">
              Loading projects...
            </div>
          )}

          {!loading && filteredProjects.length === 0 && (
            <div className="p-6 text-center text-xs text-gray-400">
              {searchQuery ? 'No matching projects found' : 'No projects yet. Create one!'}
            </div>
          )}

          {filteredProjects.map((project) => (
            <ProjectContactItem
              key={project.id}
              project={project}
              isSelected={activeProject?.id === project.id}
              orgName={orgName}
              todoCount={todoCounter[project.id] || 0}
              onSelect={handleSelectProject}
            />
          ))}
        </div>
      </aside>

      {/* RIGHT COLUMN: Full-Screen WhatsApp Chat OR Empty Selection State */}
      <main
        className={`flex-1 h-full overflow-hidden flex flex-col bg-white dark:bg-gray-950 ${
          !isMobileChatOpen ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeProject ? (
          <ChatFullScreen
            project={activeProject}
            orgName={orgName}
            onBackMobile={handleBackToProjectsMobile}
          />
        ) : (
          /* Empty Selection State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-gray-950">
            <div className="max-w-md space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                <HiOutlineChatBubbleLeftRight className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Welcome to {orgName} CRM
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  Select any project on the left to chat with your team and execute AI CRM workflows instantly.
                </p>
              </div>

              {/* Bot Quick Capabilities Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-left text-xs pt-2">
                <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                    📋 /Task @bot
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Auto-creates structured tasks with priority & points
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
                  <span className="font-bold text-rose-600 dark:text-rose-400 block mb-0.5">
                    🐛 /Bug @bot
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Auto-prioritizes bug reports and assignees
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                    ✉️ /Email @bot
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Drafts & sends customer updates
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
                  <span className="font-bold text-purple-600 dark:text-purple-400 block mb-0.5">
                    🤖 AI Agent Hub
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Multi-agent autonomous workspace
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
