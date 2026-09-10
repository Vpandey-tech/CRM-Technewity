'use client'

import React, { useCallback, useEffect, useState, useRef } from 'react'
import { Project } from '@prisma/client'
import { useChatStore } from '@/store/chat'
import { useEventProjectChat } from '@/events/useEventProjectChat'
import ChatMessageList from './ChatMessageList'
import ChatMessageInput from './ChatMessageInput'
import {
  HiOutlineChevronLeft,
  HiOutlineSquares2X2,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineListBullet,
  HiOutlineEllipsisVertical,
  HiOutlineBriefcase,
  HiOutlineChartBarSquare,
  HiOutlineCpuChip,
  HiOutlineFolder,
  HiOutlineTrash
} from 'react-icons/hi2'
import { messageSuccess } from '@ui-components'
import Link from 'next/link'

interface ChatFullScreenProps {
  project: Project
  orgName: string
  onBackMobile?: () => void
}

export default function ChatFullScreen({
  project,
  orgName,
  onBackMobile
}: ChatFullScreenProps) {
  const projectId = project.id
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false)
  const navMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navMenuRef.current && !navMenuRef.current.contains(event.target as Node)) {
        setIsNavMenuOpen(false)
      }
    }
    if (isNavMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNavMenuOpen])

  const {
    messages,
    isLoading,
    isSending,
    loadMessages,
    sendMessage,
    clearMessages,
    handleIncomingMessage,
    handleClearMessages
  } = useChatStore()

  // Real-time message listener via Pusher
  const onIncoming = useCallback(
    (newMsg: any) => {
      handleIncomingMessage(newMsg)
    },
    [handleIncomingMessage]
  )

  const onClear = useCallback(() => {
    handleClearMessages(projectId)
  }, [projectId, handleClearMessages])

  useEventProjectChat(projectId, onIncoming, onClear)

  // Clear chat handler
  const handleClearChat = async () => {
    setIsNavMenuOpen(false)
    const confirmed = window.confirm(
      'Are you sure you want to clear the chat history for this project? This cannot be undone.'
    )
    if (!confirmed) return
    const success = await clearMessages(projectId)
    if (success) {
      messageSuccess('Chat history cleared')
    }
  }

  // Load messages when project changes
  useEffect(() => {
    if (projectId) {
      loadMessages(projectId)
    }
  }, [projectId, loadMessages])

  // Fallback poll only if messages are in PENDING/PROCESSING status
  useEffect(() => {
    if (!projectId) return

    const hasPending = messages.some(
      (m) => m.status === 'PENDING' || m.status === 'PROCESSING'
    )
    if (!hasPending) return

    const timer = setInterval(() => {
      loadMessages(projectId)
    }, 2500)

    return () => clearInterval(timer)
  }, [projectId, messages, loadMessages])

  const initial = (project.name || 'P').trim().charAt(0).toUpperCase()

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] w-full bg-white dark:bg-gray-950 overflow-hidden relative">
      {/* WhatsApp-Style Chat Header - Strictly fixed at the top */}
      <header className="sticky top-0 z-30 h-16 px-4 shrink-0 flex items-center justify-between border-b border-gray-200/80 dark:border-gray-800/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          {onBackMobile && (
            <button
              type="button"
              onClick={onBackMobile}
              className="md:hidden -ml-1 p-2 rounded-xl text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Back to projects"
              aria-label="Back to projects"
            >
              <HiOutlineChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Project Icon */}
          <div className="relative shrink-0">
            {project.icon && project.icon.startsWith('http') ? (
              <img
                src={project.icon}
                alt={project.name}
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10"
              />
            ) : project.icon ? (
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg shadow-xs ring-1 ring-black/5 dark:ring-white/10">
                {project.icon}
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                {initial}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
          </div>

          {/* Project Details */}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {project.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <HiOutlineSparkles className="w-3.5 h-3.5" />
                AI Assistant Online
              </span>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <span className="truncate hidden sm:inline">
                Mention <code className="text-[11px] bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-semibold">@bot</code> to manage CRM
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-1.5 shrink-0 relative" ref={navMenuRef}>
          {/* Quick Kanban Board Link */}
          <Link
            href={`/${orgName}/project/${projectId}?mode=board`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors shadow-2xs"
            title="Switch to Kanban Board View"
          >
            <HiOutlineSquares2X2 className="w-4 h-4 text-indigo-500" />
            <span className="inline">Board</span>
          </Link>

          {/* Quick List View Link */}
          <Link
            href={`/${orgName}/project/${projectId}?mode=list`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors shadow-2xs"
            title="Switch to Task List View"
          >
            <HiOutlineListBullet className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">List</span>
          </Link>

          {/* Quick CRM Navigation Dropdown Button */}
          <button
            type="button"
            onClick={() => setIsNavMenuOpen((prev) => !prev)}
            className={`p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              isNavMenuOpen ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400' : ''
            }`}
            title="CRM Navigation Menu"
            aria-label="CRM Navigation Menu"
          >
            <HiOutlineEllipsisVertical className="w-5 h-5" />
          </button>

          {/* Mobile-Friendly Navigation Dropdown Menu */}
          {isNavMenuOpen && (
            <div className="absolute right-0 top-11 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200/80 dark:border-gray-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Project Views
              </div>
              <Link
                href={`/${orgName}/project/${projectId}?mode=board`}
                onClick={() => setIsNavMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
              >
                <HiOutlineSquares2X2 className="w-4 h-4 text-indigo-500" />
                <span>Kanban Board</span>
              </Link>
              <Link
                href={`/${orgName}/project/${projectId}?mode=list`}
                onClick={() => setIsNavMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
              >
                <HiOutlineListBullet className="w-4 h-4 text-emerald-500" />
                <span>Task List Table</span>
              </Link>

              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Workspace CRM
              </div>
              <Link
                href={`/${orgName}/my-works`}
                onClick={() => setIsNavMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
              >
                <HiOutlineBriefcase className="w-4 h-4 text-indigo-500" />
                <span>My Works</span>
              </Link>
              <Link
                href={`/${orgName}/dashboard`}
                onClick={() => setIsNavMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
              >
                <HiOutlineChartBarSquare className="w-4 h-4 text-amber-500" />
                <span>Dashboard</span>
              </Link>
              <Link
                href={`/${orgName}/ai-hub`}
                onClick={() => setIsNavMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
              >
                <HiOutlineCpuChip className="w-4 h-4 text-purple-500" />
                <span>AI Agent Hub</span>
              </Link>

              {onBackMobile && (
                <>
                  <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsNavMenuOpen(false)
                      onBackMobile()
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors text-left"
                  >
                    <HiOutlineFolder className="w-4 h-4 text-blue-500" />
                    <span>Switch Project (All)</span>
                  </button>
                </>
              )}

              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
              <button
                type="button"
                onClick={handleClearChat}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left font-medium"
              >
                <HiOutlineTrash className="w-4 h-4 text-red-500" />
                <span>Clear Chat History</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Chat Messages List (reusing ChatMessageList) */}
      <div className="flex-1 overflow-hidden flex flex-col bg-gray-50/50 dark:bg-gray-950">
        <ChatMessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* Chat Input Container (reusing ChatMessageInput) */}
      <div className="shrink-0 border-t border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900/90 backdrop-blur-md">
        <ChatMessageInput
          projectId={projectId}
          onSendMessage={(content, fileIds, mentionUserIds) =>
            sendMessage(projectId, content, fileIds, mentionUserIds)
          }
          isSending={isSending}
        />
      </div>
    </div>
  )
}
