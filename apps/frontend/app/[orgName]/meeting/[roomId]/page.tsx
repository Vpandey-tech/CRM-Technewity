'use client'
import dynamic from 'next/dynamic'

const MeetingRoom = dynamic(() => import('@/features/MeetingRoom'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white font-medium text-sm">
      Loading meeting room...
    </div>
  )
})

export default function Page() {
  return <MeetingRoom />
}
