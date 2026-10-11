import { Pressable, Text, View } from 'react-native';

import { type Task } from '@/shared/api/types';
import { Icon } from '@/shared/components/Icon';

export type TaskFilter = 'Усі' | Task['category'];

export function TaskList({
  tasks,
  filter,
  setFilter,
  toggleTask,
  onAdd,
  onEdit,
  onDelete,
  busy,
}: {
  tasks: Task[];
  filter: TaskFilter;
  setFilter: (filter: TaskFilter) => void;
  toggleTask: (id: string) => void;
  onAdd: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  busy: boolean;
}) {
  const visibleTasks = tasks.filter((task) => filter === 'Усі' || task.category === filter);

  return (
    <View className="rounded-[28px] border border-line bg-white p-5 sm:p-6">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1 flex-row items-center gap-2.5">
          <Text className="shrink text-[21px] font-semibold tracking-[-0.6px] text-ink">
            Маленькі кроки
          </Text>
          <View className="shrink-0 rounded-full bg-canvas px-2.5 py-1">
            <Text className="text-xs font-medium text-[#656D62]">
              {tasks.filter((task) => task.completed).length}/{tasks.length}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="Додати завдання"
          className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-canvas active:bg-accent">
          <Icon name="plus" size={20} />
        </Pressable>
      </View>
      <Text className="mt-1 text-[13px] text-[#656D62]">Великі зміни починаються з малого.</Text>
      <View className="mb-2 mt-5 flex-row gap-2">
        {(['Усі', 'Робота', 'Особисте'] as const).map((item) => (
          <Pressable
            key={item}
            onPress={() => setFilter(item)}
            accessibilityRole="button"
            aria-selected={filter === item}
            className={`min-h-10 justify-center rounded-full px-4 active:opacity-70 ${filter === item ? 'bg-ink' : 'bg-canvas'}`}>
            <Text
              className={`text-xs font-medium ${filter === item ? 'text-white' : 'text-[#656D62]'}`}>
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
      {visibleTasks.map((task, index) => (
        <View key={task.id} className="border-b border-line pb-2">
          <Pressable
            disabled={busy}
            accessibilityRole="checkbox"
            accessibilityLabel={task.title}
            aria-checked={task.completed}
            onPress={() => toggleTask(task.id)}
            className={`flex-row items-center gap-3 py-4 active:opacity-60 ${index !== visibleTasks.length - 1 ? 'border-b border-line' : ''}`}>
            <View
              className={`h-6 w-6 items-center justify-center rounded-lg ${task.completed ? 'bg-accent' : 'border border-[#CDD3C6]'}`}>
              {task.completed && <Icon name="check" size={16} />}
            </View>
            <View className="flex-1 gap-1.5">
              <Text
                className={`text-[14px] font-medium ${task.completed ? 'text-[#7A8177] line-through' : 'text-ink'}`}>
                {task.title}
              </Text>
              <View className="flex-row items-center gap-1.5">
                <View
                  className={`h-1 w-1 rounded-full ${task.category === 'Робота' ? 'bg-[#8BA67C]' : 'bg-[#C99673]'}`}
                />
                <Text className="text-[11px] text-[#656D62]">{task.category}</Text>
              </View>
            </View>
            <Text className="text-xs text-[#656D62]">{task.minutes} хв</Text>
          </Pressable>
          <View className="flex-row justify-end gap-2">
            <Pressable
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`Редагувати: ${task.title}`}
              onPress={() => onEdit(task)}
              className="min-h-11 flex-row items-center gap-2 rounded-xl px-3 active:bg-canvas">
              <Icon name="edit" size={16} />
              <Text className="text-xs text-forest">Змінити</Text>
            </Pressable>
            <Pressable
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`Видалити: ${task.title}`}
              onPress={() => onDelete(task)}
              className="h-11 w-11 items-center justify-center rounded-xl active:bg-canvas">
              <Icon name="trash" size={18} color="#A23C30" />
            </Pressable>
          </View>
        </View>
      ))}
      {visibleTasks.length === 0 && (
        <Text className="py-8 text-center text-sm text-[#656D62]">
          Тут поки тихо. Додай свій перший крок.
        </Text>
      )}
    </View>
  );
}
