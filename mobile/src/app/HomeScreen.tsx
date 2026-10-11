import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FocusCard } from '@/features/focus/FocusCard';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { FocusSummary } from '@/features/statistics/FocusSummary';
import { ProgressHistory } from '@/features/statistics/ProgressHistory';
import { StatsCard } from '@/features/statistics/StatsCard';
import { DeleteTaskModal } from '@/features/tasks/DeleteTaskModal';
import { TaskFormModal } from '@/features/tasks/TaskFormModal';
import { TaskList, type TaskFilter } from '@/features/tasks/TaskList';
import { useSession } from '@/providers/SessionProvider';
import { type Task, type TaskInput, type UserProfile } from '@/shared/api/types';
import { createTask, deleteTask, updateTask } from '@/shared/api/workspace';
import { Brand } from '@/shared/components/Brand';
import { Icon } from '@/shared/components/Icon';
import { NoteCard } from '@/shared/components/NoteCard';
import { localDay } from '@/shared/utils/date';
import { useWorkspace } from '@/store/useWorkspace';

import { BottomTabs } from './BottomTabs';
import { Sidebar } from './Sidebar';
import { headings, type Tab } from './tabs';

export function HomeScreen({ profile }: { profile: UserProfile }) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1024;
  const twoColumns = width >= 760;
  const { setProfile, signOut } = useSession();
  const workspace = useWorkspace();
  const [tab, setTab] = useState<Tab>('today');
  const [filter, setFilter] = useState<TaskFilter>('Усі');
  const [form, setForm] = useState<{ id: number; open: boolean; task: Task | null }>({
    id: 0,
    open: false,
    task: null,
  });
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const tasks = workspace.data?.tasks ?? [];
  const sessions = workspace.data?.sessions ?? [];
  const todaySessions = sessions.filter(
    (session) => localDay(session.completedAt) === localDay(workspace.now)
  );
  const focusMinutes = todaySessions.reduce((sum, session) => sum + session.minutes, 0);
  const completedSessions = todaySessions.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const date = new Intl.DateTimeFormat('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  function openForm(task: Task | null) {
    setForm((current) => ({ id: current.id + 1, open: true, task }));
  }

  function closeForm() {
    setForm((current) => ({ ...current, open: false }));
  }

  async function saveTask(values: TaskInput) {
    const { task } = form;
    const saved = await workspace.mutate(() =>
      task ? updateTask(task.id, values) : createTask(values)
    );
    if (saved) {
      setFilter('Усі');
      closeForm();
      setTab('tasks');
    }
  }

  function toggleTask(id: string) {
    const task = tasks.find((item) => item.id === id);
    if (task) void workspace.mutate(() => updateTask(id, { ...task, completed: !task.completed }));
  }

  async function confirmDelete() {
    if (deletingTask && (await workspace.mutate(() => deleteTask(deletingTask.id))))
      setDeletingTask(null);
  }

  if (!workspace.data)
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas px-6">
        <ActivityIndicator color="#253D32" />
        <Text className="mt-5 text-center text-sm text-forest">
          {workspace.error || 'Завантажуємо твій простір…'}
        </Text>
        {!!workspace.error && (
          <Pressable
            accessibilityRole="button"
            onPress={() => void workspace.refresh()}
            className="mt-5 rounded-xl bg-accent px-5 py-4">
            <Text className="text-forest">Спробувати ще раз</Text>
          </Pressable>
        )}
      </SafeAreaView>
    );

  const taskList = (
    <TaskList
      tasks={tasks}
      filter={filter}
      setFilter={setFilter}
      toggleTask={toggleTask}
      onEdit={openForm}
      onDelete={setDeletingTask}
      busy={workspace.busy}
      onAdd={() => openForm(null)}
    />
  );
  const stats = (
    <StatsCard
      focusMinutes={focusMinutes}
      completedSessions={completedSessions}
      completedTasks={completedTasks}
      totalTasks={tasks.length}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View className="flex-1 flex-row">
        {desktop && <Sidebar tab={tab} profile={profile} onChange={setTab} />}
        <View className="flex-1">
          <ScrollView
            key={tab}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => void workspace.refresh()}
                tintColor="#253D32"
              />
            }
            className="flex-1"
            contentContainerClassName="items-center pb-8"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View className={`w-full max-w-[1160px] ${desktop ? 'px-10 pt-10' : 'px-5 pt-5'}`}>
              {!desktop && (
                <View className="mb-7 flex-row items-center justify-between">
                  <Brand />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Відкрити профіль"
                    onPress={() => setTab('profile')}
                    className="min-h-11 flex-row items-center gap-2 rounded-full border border-line px-4 active:bg-accent">
                    <Icon name="user" size={20} />
                    <Text className="text-xs font-medium text-forest">Профіль</Text>
                  </Pressable>
                </View>
              )}
              <View className="mb-7 flex-row items-center justify-between gap-4">
                <View className="flex-1">
                  <Text className="mb-3 text-[10px] font-semibold uppercase tracking-[1.6px] text-[#656D62]">
                    {date}
                  </Text>
                  <Text
                    className={`${desktop ? 'text-[42px] leading-[48px]' : width < 360 ? 'text-[28px] leading-[34px]' : 'text-[34px] leading-[40px]'} font-semibold tracking-[-1.6px] text-forest`}>
                    {headings[tab].title}
                  </Text>
                  <Text className="mt-3 text-[13px] leading-5 text-[#656D62]">
                    {headings[tab].subtitle}
                  </Text>
                </View>
                {tab !== 'profile' && (
                  <Pressable
                    disabled={workspace.busy}
                    onPress={() => openForm(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Нове завдання"
                    className={`min-h-12 items-center justify-center rounded-full border border-[#D5DBCE] active:bg-accent ${desktop ? 'flex-row gap-2 px-5' : 'w-12 self-start'}`}>
                    <Icon name="plus" size={19} />
                    {desktop && (
                      <Text className="text-xs font-medium text-forest">Нове завдання</Text>
                    )}
                  </Pressable>
                )}
              </View>
              {!!workspace.error && (
                <View className="mb-5 rounded-2xl bg-[#F9E7E2] p-4">
                  <Text accessibilityRole="alert" className="text-sm text-[#A23C30]">
                    {workspace.error}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void workspace.refresh()}
                    className="min-h-11 justify-center">
                    <Text className="font-medium text-forest">Оновити дані</Text>
                  </Pressable>
                </View>
              )}
              {tab === 'profile' && (
                <ProfileScreen
                  profile={profile}
                  onProfileChange={setProfile}
                  onSignOut={signOut}
                  totalTasks={completedTasks}
                  totalMinutes={sessions.reduce((sum, session) => sum + session.minutes, 0)}
                />
              )}
              {tab === 'today' && (
                <View className="gap-5">
                  <View className={twoColumns ? 'flex-row gap-5' : 'gap-5'}>
                    <View className={twoColumns ? 'flex-[1.08]' : ''}>
                      <FocusCard {...workspace.timer} />
                    </View>
                    <View className={`${twoColumns ? 'flex-1' : ''} gap-5`}>
                      {stats}
                      <NoteCard />
                    </View>
                  </View>
                  {taskList}
                </View>
              )}
              {tab === 'tasks' && (
                <View className="gap-5">
                  {taskList}
                  <NoteCard />
                </View>
              )}
              {tab === 'progress' && (
                <View className="gap-5">
                  {stats}
                  <ProgressHistory sessions={sessions} now={workspace.now} />
                  <FocusSummary
                    focusMinutes={focusMinutes}
                    completedSessions={completedSessions}
                    onOpenFocus={() => setTab('today')}
                  />
                  <NoteCard />
                </View>
              )}
              <View className="mt-7 flex-row items-center justify-center gap-2">
                <Icon name="leaf" size={14} color="#89927E" />
                <Text className="text-[10px] tracking-[0.3px] text-[#656D62]">
                  Роби менше, але з більшою увагою.
                </Text>
              </View>
            </View>
          </ScrollView>
          {!desktop && <BottomTabs tab={tab} onChange={setTab} />}
        </View>
      </View>
      <TaskFormModal
        key={form.id}
        visible={form.open}
        task={form.task}
        busy={workspace.busy}
        error={workspace.error}
        onClose={closeForm}
        onSubmit={(values) => void saveTask(values)}
      />
      <DeleteTaskModal
        task={deletingTask}
        busy={workspace.busy}
        error={workspace.error}
        onCancel={() => setDeletingTask(null)}
        onConfirm={() => void confirmDelete()}
      />
    </SafeAreaView>
  );
}
