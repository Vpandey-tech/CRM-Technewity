import { useEffect, useRef } from 'react'
import { usePusher } from './usePusher'
import { Notification } from '@prisma/client'

export const useEventNotification = (userId: string | undefined, cb: (data: Notification) => void) => {
  const { channelTeamCollab } = usePusher()
  const cbRef = useRef(cb)

  useEffect(() => {
    cbRef.current = cb
  }, [cb])

  useEffect(() => {
    if (!channelTeamCollab || !userId) return

    const eventName = `notification-${userId}`
    console.log(`[Pusher] Subscribing to ${eventName}`)

    const handleNotification = (data: Notification) => {
      console.log(`[Pusher] Received notification:`, data)
      cbRef.current && cbRef.current(data)
    }

    channelTeamCollab.bind(eventName, handleNotification)

    return () => {
      channelTeamCollab.unbind(eventName, handleNotification)
    }
  }, [channelTeamCollab, userId])
}
