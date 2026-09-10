'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProjectStore } from '@/store/project'
import { useServiceProject } from '@/services/hooks/useServiceProject'
import { useMemberStore } from '@/store/member'
import { useTodoCounter } from '@/hooks/useTodoCounter'
import { taskGetByCond } from '@/services/task'
import { Task, TaskPriority } from '@prisma/client'
import {
  HiOutlineChartBarSquare,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBriefcase,
  HiOutlineCpuChip,
  HiOutlineSquares2X2,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineArrowTrendingUp,
  HiOutlineUsers,
  HiOutlineFolder,
  HiOutlineChevronRight,
  HiPlus,
  HiOutlineArrowPath
} from 'react-icons/hi2'
import ProjectAddModal from '@/features/Project/Add/ProjectAddModal'

export default function WorkspaceDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const orgName = (params?.orgName as string) || ''

  const { projects, loading: projectsLoading } = useProjectStore()
  const { members } = useMemberStore()
  const { todoCounter } = useTodoCounter()
  useServiceProject()

  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)

  // Fetch recent tasks across workspace
  const fetchTasks = async () => {
    setTasksLoading(true)
    try {
      const res = await taskGetByCond({ take: 100 })
      const data = res.data?.data || []
      setAllTasks(data)
    } catch (err) {
      console.error('[Dashboard] Failed to fetch workspace tasks:', err)
    } finally {
      setTasksLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  // KPI Computations
  const stats = useMemo(() => {
    const totalProjects = projects.length
    const totalTasks = allTasks.length
    const completedTasks = allTasks.filter((t) => t.done).length
    const urgentTasks = allTasks.filter(
      (t) => !t.done && (t.priority === TaskPriority.URGENT || t.priority === TaskPriority.HIGH)
    ).length
    const botCreatedTasks = allTasks.filter((t: any) => t.createdVia === 'BOT').length

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      urgentTasks,
      botCreatedTasks,
      activeMembers: members.length
    }
  }, [projects, allTasks, members])

  const botTasks = useMemo(() => {
    return allTasks.filter((t: any) => t.createdVia === 'BOT').slice(0, 6)
  }, [allTasks])

  const urgentTasksList = useMemo(() => {
    return allTasks
      .filter((t) => !t.done && (t.priority === TaskPriority.URGENT || t.priority === TaskPriority.HIGH))
      .slice(0, 6)
  }, [allTasks])

  return (
    <div className="min-h-screen bg-gray-50/60 dark:bg-gray-950 text-gray-900 dark:text-white p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20 shrink-0">
            <HiOutlineChartBarSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <span>{orgName}</span>
              <HiOutlineChevronRight className="w-3 h-3 text-gray-400" />
              <span className="text-indigo-600 dark:text-indigo-400">Dashboard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Workspace Overview
            </h1>
          </div>
        </div>

        {/* Quick Nav Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <Link
            href={`/${orgName}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
            <span>Open Chat CRM</span>
          </Link>
          <Link
            href={`/${orgName}/my-works`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-colors"
          >
            <HiOutlineBriefcase className="w-4 h-4 text-indigo-500" />
            <span>My Works</span>
          </Link>
          <Link
            href={`/${orgName}/ai-hub`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-colors"
          >
            <HiOutlineCpuChip className="w-4 h-4 text-purple-500" />
            <span>AI Hub</span>
          </Link>
          <button
            type="button"
            onClick={fetchTasks}
            title="Refresh"
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <HiOutlineArrowPath className={`w-4 h-4 ${tasksLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Projects */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Projects</span>
            <HiOutlineFolder className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {projectsLoading ? '...' : stats.totalProjects}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Active workspace teams</div>
        </div>

        {/* Total Tasks */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Tasks</span>
            <HiOutlineArrowTrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {tasksLoading ? '...' : stats.totalTasks}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Total tracked items</div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Completed</span>
            <HiOutlineCheckCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {tasksLoading ? '...' : stats.completedTasks}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Done & resolved</div>
        </div>

        {/* Urgent Tasks */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Urgent / High</span>
            <HiOutlineExclamationCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {tasksLoading ? '...' : stats.urgentTasks}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Attention required</div>
        </div>

        {/* AI Bot Created */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">AI Created</span>
            <HiOutlineSparkles className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {tasksLoading ? '...' : stats.botCreatedTasks}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Autonomous workflows</div>
        </div>

        {/* Team Members */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Members</span>
            <HiOutlineUsers className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {stats.activeMembers}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Collaborating staff</div>
        </div>
      </div>

      {/* Projects Directory & Quick Launch Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HiOutlineFolder className="w-5 h-5 text-indigo-500" />
              <span>Workspace Projects</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Jump directly into WhatsApp chat or Kanban board for any project
            </p>
          </div>
          <ProjectAddModal
            triggerComponent={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <HiPlus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            }
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {projects.map((project) => {
            const initial = (project.name || 'P').charAt(0).toUpperCase()
            const count = todoCounter[project.id] || 0
            return (
              <div
                key={project.id}
                className="p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 bg-gray-50/50 dark:bg-gray-800/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {project.icon && project.icon.startsWith('http') ? (
                        <img
                          src={project.icon}
                          alt={project.name}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-black/5 shrink-0"
                        />
                      ) : project.icon ? (
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-base shadow-2xs shrink-0">
                          {project.icon}
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0">
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {project.name}
                        </h3>
                        <span className="text-[10px] text-gray-400">
                          {count} open tasks
                        </span>
                      </div>
                    </div>
                  </div>
                  {project.desc && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 mb-3">
                      {project.desc}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between gap-2 mt-2">
                  <Link
                    href={`/${orgName}?p=${project.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
                    <span>WhatsApp Chat</span>
                  </Link>
                  <Link
                    href={`/${orgName}/project/${project.id}?mode=board`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <HiOutlineSquares2X2 className="w-3.5 h-3.5" />
                    <span>Kanban</span>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Two Column Grid: Urgent Tasks & AI Automation Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tasks */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HiOutlineExclamationCircle className="w-4 h-4 text-rose-500" />
              <span>High Priority & Urgent Tasks</span>
            </h2>
            <Link
              href={`/${orgName}/my-works`}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              View all
            </Link>
          </div>

          {urgentTasksList.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
              No urgent tasks currently outstanding. Great job!
            </div>
          ) : (
            <div className="space-y-2">
              {urgentTasksList.map((task) => (
                <div
                  key={task.id}
                  onClick={() =>
                    router.push(
                      `/${orgName}/project/${task.projectId}?mode=task&taskId=${task.id}`
                    )
                  }
                  className="p-3 rounded-xl bg-gray-50/60 dark:bg-gray-800/40 hover:bg-gray-100/80 dark:hover:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 cursor-pointer transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {task.title}
                    </h4>
                    <span className="text-[10px] text-gray-400">
                      Priority:{' '}
                      <span className="font-semibold text-rose-600 uppercase">
                        {task.priority}
                      </span>
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium shrink-0">
                    Open Task →
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Bot Created Tasks */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HiOutlineSparkles className="w-4 h-4 text-purple-500" />
              <span>Recent AI Bot Automations</span>
            </h2>
            <Link
              href={`/${orgName}/ai-hub`}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              AI Operations Hub
            </Link>
          </div>

          {botTasks.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
              No tasks created by AI Bot yet. Type <code>@bot /Task</code> in any project chat to trigger!
            </div>
          ) : (
            <div className="space-y-2">
              {botTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() =>
                    router.push(
                      `/${orgName}/project/${task.projectId}?mode=task&taskId=${task.id}`
                    )
                  }
                  className="p-3 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50/80 dark:hover:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 cursor-pointer transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {task.title}
                    </h4>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                      Created via @bot command
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium shrink-0">
                    View Task →
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
