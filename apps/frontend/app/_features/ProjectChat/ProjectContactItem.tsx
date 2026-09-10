'use client'

import React from 'react'
import { Project } from '@prisma/client'
import { HiOutlineSquares2X2, HiOutlineSparkles } from 'react-icons/hi2'
import Link from 'next/link'

interface ProjectContactItemProps {
  project: Project
  isSelected: boolean
  orgName: string
  todoCount?: number
  onSelect: (project: Project) => void
}

export default function ProjectContactItem({
  project,
  isSelected,
  orgName,
  todoCount = 0,
  onSelect
}: ProjectContactItemProps) {
  const { id, name, icon, desc } = project

  // Generate pleasant avatar background from project name
  const getAvatarGradient = (title: string) => {
    const colors = [
      'from-indigo-500 to-purple-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-rose-500 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-violet-500 to-indigo-600'
    ]
    let hash = 0
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  const initial = (name || 'P').trim().charAt(0).toUpperCase()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(project)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(project)
        }
      }}
      className={`group relative flex items-center gap-3 px-3.5 py-3 rounded-xl cursor-pointer transition-all duration-200 select-none ${
        isSelected
          ? 'bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-900 dark:text-indigo-100 ring-1 ring-indigo-500/30 dark:ring-indigo-400/30'
          : 'hover:bg-gray-100/80 dark:hover:bg-gray-800/60 text-gray-800 dark:text-gray-200'
      }`}
    >
      {/* Active Indicator Bar on left */}
      {isSelected && (
        <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />
      )}

      {/* Avatar / Icon */}
      <div className="relative shrink-0">
        {icon && icon.startsWith('http') ? (
          <img
            src={icon}
            alt={name}
            className="w-11 h-11 rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10 shadow-xs"
          />
        ) : icon ? (
          <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl shadow-xs ring-1 ring-black/5 dark:ring-white/10">
            {icon}
          </div>
        ) : (
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarGradient(
              name
            )} flex items-center justify-center text-white font-bold text-base shadow-xs`}
          >
            {initial}
          </div>
        )}

        {/* AI Bot status dot */}
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900 flex items-center justify-center"
          title="AI Assistant Active"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5 mb-0.5">
          <h4
            className={`text-sm font-semibold truncate ${
              isSelected
                ? 'text-indigo-950 dark:text-white'
                : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {name}
          </h4>
          {todoCount > 0 && (
            <span className="shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              {todoCount}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <p className="truncate flex items-center gap-1">
            <HiOutlineSparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">
              {desc ? desc : 'Chat with team & AI assistant'}
            </span>
          </p>
        </div>
      </div>

      {/* Action to switch to full board view */}
      <Link
        href={`/${orgName}/project/${id}?mode=board`}
        onClick={(e) => e.stopPropagation()}
        title="Open Project Board"
        className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        <HiOutlineSquares2X2 className="w-4 h-4" />
      </Link>
    </div>
  )
}
