import { useEffect, useRef } from 'react'
import { usePusher } from './usePusher'
import { ChatMessage } from '@prisma/client'

export const useEventProjectChat = (
  projectId: string,
  cb: (data: ChatMessage) => void,
  onClear?: () => void
) => {
  const { channelTeamCollab } = usePusher()
  const cbRef = useRef(cb)
  const onClearRef = useRef(onClear)

  useEffect(() => {
    cbRef.current = cb
    onClearRef.current = onClear
  }, [cb, onClear])

  useEffect(() => {
    if (!channelTeamCollab || !projectId) return

    const eventName = `chat-message-${projectId}`
    const clearEventName = `chat-clear-${projectId}`

    const handleMessage = (data: ChatMessage) => {
      cbRef.current && cbRef.current(data)
    }

    const handleClear = () => {
      onClearRef.current && onClearRef.current()
    }

    channelTeamCollab.bind(eventName, handleMessage)
    channelTeamCollab.bind(clearEventName, handleClear)

    return () => {
      channelTeamCollab.unbind(eventName, handleMessage)
      channelTeamCollab.unbind(clearEventName, handleClear)
    }
  }, [channelTeamCollab, projectId])
}

