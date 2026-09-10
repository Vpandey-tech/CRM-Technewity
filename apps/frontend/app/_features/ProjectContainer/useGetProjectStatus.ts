import { projectStatusGet } from '@/services/status'
import { useProjectStatusStore } from '@/store/status'
import { TaskStatus } from '@prisma/client'
import localforage from 'localforage'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'

export const useGetStatusHandler = (projectId: string, cb?: () => void) => {
  const { addAllStatuses, setStatusLoading } = useProjectStatusStore()
  const key = `PROJECT_STATUS_${projectId}`
  const setCache = (data: TaskStatus[]) => {
    localforage.setItem(key, data)
  }
  const fetchNCache = () => {
    if (!projectId) return

    setStatusLoading(true)
    projectStatusGet(projectId)
      .then(res => {
        const { data, status } = res.data || {}

        if (status !== 200 || !data || !Array.isArray(data)) {
          return
        }

        const statuses = data as TaskStatus[]
        console.log('useGetProjectStatus data:', statuses)

        // order must be ascending
        // unless re-ordering feature in setting/status and view/board will be error
        const sortedStatus = statuses.sort((a, b) => a.order - b.order)
        addAllStatuses(sortedStatus)

        // Wipe first then write fresh — prevents deleted statuses surviving stale Redis
        localforage.removeItem(key).then(() => {
          localforage.setItem(key, sortedStatus)
        })
      })
      .catch(err => {
        console.error('get project status error:', err)
      })
      .finally(() => {
        setStatusLoading(false)
        cb && cb()
      })
  }

  return {
    fetchNCache
  }
}

export default function useGetProjectStatus() {
  const params = useParams()
  const projectId = (params?.projectId as string) || ''
  const { addAllStatuses } = useProjectStatusStore()
  const { fetchNCache } = useGetStatusHandler(projectId)

  const key = `PROJECT_STATUS_${projectId}`

  useEffect(() => {
    if (!projectId) return
    localforage.getItem(key).then(val => {
      if (val && Array.isArray(val) && val.length > 0) {
        addAllStatuses(val as TaskStatus[])
      }
    }).catch(() => {})
  }, [projectId, key])

  useEffect(() => {
    if (projectId) {
      fetchNCache()
    }
  }, [projectId])
}

