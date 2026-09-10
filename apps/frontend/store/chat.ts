import { create } from 'zustand'
import { ChatMessage, ChatMessageStatus } from '@prisma/client'
import { chatGetMessages, chatSendMessage } from '@/services/chat'
import { messageError } from '@ui-components'

interface IChatStore {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  toggleOpen: () => void
  currentProjectId: string | null
  messages: ChatMessage[]
  isLoading: boolean
  isSending: boolean
  loadMessages: (projectId: string) => Promise<void>
  sendMessage: (projectId: string, content: string, fileIds?: string[], mentionUserIds?: string[]) => Promise<boolean>
  clearMessages: (projectId: string) => Promise<boolean>
  handleIncomingMessage: (msg: ChatMessage) => void
  handleClearMessages: (projectId: string) => void
}

export const useChatStore = create<IChatStore>((set, get) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  currentProjectId: null,
  messages: [],
  isLoading: false,
  isSending: false,

  loadMessages: async (projectId: string) => {
    if (!projectId) return
    const prev = get().currentProjectId
    if (prev !== projectId) {
      set({ currentProjectId: projectId, messages: [], isLoading: true })
    } else {
      set({ isLoading: true })
    }

    try {
      const res = await chatGetMessages(projectId, { limit: 100 })
      // Discard results if user switched projects while request was in flight
      if (get().currentProjectId !== projectId) return

      const data = res.data?.data || []
      set({ messages: data, isLoading: false })
      if (typeof window !== 'undefined' && data.some((m: any) => m.linkedTaskId)) {
        window.dispatchEvent(new CustomEvent('crm-sync-tasks'))
      }
    } catch (error) {
      console.error('[Chat Store] Failed to load messages:', error)
      if (get().currentProjectId === projectId) {
        set({ isLoading: false })
      }
    }
  },

  sendMessage: async (projectId: string, content: string, fileIds = [], mentionUserIds = []) => {
    if (!content || !content.trim()) return false

    try {
      set({ isSending: true })
      const res = await chatSendMessage(projectId, {
        content,
        fileIds,
        mentionUserIds
      })

      const sentMsg = res.data?.data
      if (sentMsg && get().currentProjectId === projectId) {
        set((state) => {
          const exists = state.messages.some((m) => m.id === sentMsg.id)
          if (!exists) {
            return { messages: [...state.messages, sentMsg] }
          }
          return state
        })
      }
      set({ isSending: false })
      return true
    } catch (error) {
      console.error('[Chat Store] Send error:', error)
      messageError('Failed to send message')
      set({ isSending: false })
      return false
    }
  },

  clearMessages: async (projectId: string) => {
    try {
      const { chatClearMessages } = await import('@/services/chat')
      await chatClearMessages(projectId)
      if (get().currentProjectId === projectId) {
        set({ messages: [] })
      }
      return true
    } catch (error) {
      console.error('[Chat Store] Clear messages error:', error)
      messageError('Failed to clear chat history')
      return false
    }
  },

  handleIncomingMessage: (msg: ChatMessage) => {
    if (!msg || !msg.id) return
    const current = get().currentProjectId
    // Ensure message belongs to currently active project only (strict WhatsApp-style isolation)
    if (current && msg.projectId && msg.projectId !== current) {
      return
    }

    set((state) => {
      const idx = state.messages.findIndex((m) => m.id === msg.id)
      if (idx >= 0) {
        const updated = [...state.messages]
        updated[idx] = msg
        return { messages: updated }
      } else {
        return { messages: [...state.messages, msg] }
      }
    })

    // If message is linked to a task or is a bot completion reply, trigger board task sync
    if (typeof window !== 'undefined' && (msg.linkedTaskId || (msg as any).isBotReply)) {
      try {
        window.dispatchEvent(new CustomEvent('crm-sync-tasks'))
      } catch (err) {
        console.error('[Chat Store] Task sync dispatch error:', err)
      }
    }
  },

  handleClearMessages: (projectId: string) => {
    if (get().currentProjectId === projectId) {
      set({ messages: [] })
    }
  }
}))
