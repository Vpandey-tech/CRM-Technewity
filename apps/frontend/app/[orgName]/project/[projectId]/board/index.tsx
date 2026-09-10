import TaskFilter from '@/features/TaskFilter'
import BoardContainer from './BoardContainer'
import TaskMultipleActions from '@/features/TaskMultipleActions'

export default function BoardRoot() {
  return (
    <div className="flex flex-col h-full w-full">
      <TaskFilter />
      <BoardContainer />
      <TaskMultipleActions />
    </div>
  )
}

