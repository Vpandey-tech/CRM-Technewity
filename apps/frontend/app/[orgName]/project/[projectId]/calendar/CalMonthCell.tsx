import { format } from 'date-fns'
import StrictDroppable from '@/components/Dnd/StrictDroppable'
import CalMonthTaskList from './CalMonthTaskList'
import CalendarTaskCreate from './CalendarTaskCreate'
import { useCalendarContext } from './context'

interface ICalMonthDay {
  day: Date
}
export default function CalMonthDay({ day }: ICalMonthDay) {
  const { month } = useCalendarContext()
  const today = new Date()
  const dMonth = day.getMonth()

  const notInMonth = month !== dMonth
  const isToday = day.getDate() === today.getDate() && month === dMonth
  const classes = ['calendar-day custom-scrollbar']

  !notInMonth
    ? classes.push('in-month')
    : classes.push('not-in-month')
  isToday && classes.push('today')

  return (
    <StrictDroppable droppableId={day.toDateString()} type="date">
      {provided => (
        <div
          className={classes.join(' ')}
          {...provided.droppableProps}
          ref={provided.innerRef}>
          <span className="day-display">{format(day, 'dd')}</span>
          <CalMonthTaskList day={day} />
          {provided.placeholder}
          <CalendarTaskCreate dueDate={day} />
        </div>
      )}
    </StrictDroppable>
  )
}
