'use client'

import React, { useMemo } from 'react'
import { useMemberStore } from '@/store/member'
import { useTaskStore } from '@/store/task'
import { useUrl } from '@/hooks/useUrl'
import { useOrgSlug } from '@/hooks/useOrgSlug'
import { useRouter } from 'next/navigation'
import { HiOutlineUserGroup, HiOutlineClock, HiOutlineCheckCircle } from 'react-icons/hi2'
import DbCompDelete from './DbCompDelete'
import DbCompDragHandler from './DbCompDragHandler'

interface DbCompTeamActivityProps {
  id: string
  title: string
  config?: any
}

export default function DbCompTeamActivity({
  id,
  title,
  config
}: DbCompTeamActivityProps) {
  const { members } = useMemberStore()
  const { tasks } = useTaskStore()
  const { projectId } = useUrl()
  const { orgSlug } = useOrgSlug()
  const router = useRouter()

  // Map members to their assigned active tasks
  const memberActivities = useMemo(() => {
    return members.map((member) => {
      const assignedTasks = (tasks || []).filter(
        (t) => t.assigneeIds && t.assigneeIds.includes(member.id) && !t.done
      )
      return {
        member,
        tasks: assignedTasks
      }
    })
  }, [members, tasks])

  const totalWorkingMembers = memberActivities.filter((m) => m.tasks.length > 0).length

  return (
    <div className="relative h-full w-full bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-800/80 shadow-xs flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <DbCompDragHandler />
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <HiOutlineUserGroup className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
              {title || 'Who is Working on What'}
            </h3>
            <p className="text-[11px] text-gray-400 font-medium">
              Live task assignments across team
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {totalWorkingMembers} active members
          </span>
          <DbCompDelete id={id} />
        </div>
      </div>

      {/* Team Member Cards */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {memberActivities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 text-xs">
            <p>No team members found in this project.</p>
          </div>
        ) : (
          memberActivities.map(({ member, tasks: mTasks }) => {
            const initial = (member.name || member.email || 'U').charAt(0).toUpperCase()

            return (
              <div
                key={member.id}
                className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-800/50 transition-all hover:shadow-xs"
              >
                {/* Member Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name || member.email}
                        className="w-7 h-7 rounded-lg object-cover ring-1 ring-black/5"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                        {initial}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                        {member.name || member.email.split('@')[0]}
                      </h4>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                        {member.role || 'MEMBER'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    {mTasks.length} {mTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>

                {/* Assigned Tasks List */}
                {mTasks.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic pl-9">
                    No active tasks assigned
                  </p>
                ) : (
                  <div className="space-y-1.5 pl-9">
                    {mTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        onClick={() =>
                          router.push(
                            `/${orgSlug}/project/${projectId || task.projectId}?mode=task&taskId=${task.id}`
                          )
                        }
                        className="flex items-center justify-between py-1 px-2 rounded-lg bg-white dark:bg-gray-900/80 border border-gray-200/60 dark:border-gray-800 text-xs hover:border-indigo-500/50 cursor-pointer transition-colors"
                      >
                        <span className="truncate font-medium text-gray-800 dark:text-gray-200 max-w-[200px] sm:max-w-xs">
                          {task.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {task.priority && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                task.priority === 'URGENT'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                  : task.priority === 'HIGH'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                              }`}
                            >
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {mTasks.length > 3 && (
                      <p className="text-[10px] text-indigo-500 font-medium">
                        +{mTasks.length - 3} more assigned tasks
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
