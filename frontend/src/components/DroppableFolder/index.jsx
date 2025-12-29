/**
 * DroppableFolder - 可接收拖拽的文件夹组件
 */
import { useDrop } from 'react-dnd'
import { message } from 'antd'
import { useNotesStore } from '../../stores'

export default function DroppableFolder({ folder, children, onDrop }) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'note',
    drop: (item) => {
      if (item.type === 'note') {
        onDrop(item.id, folder?.id)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  return (
    <div
      ref={drop}
      className={`droppable-folder ${isOver ? 'drop-over' : ''} ${canDrop ? 'drop-can-drop' : ''}`}
    >
      {children}
    </div>
  )
}
