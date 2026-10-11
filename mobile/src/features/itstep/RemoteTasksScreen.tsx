import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/shared/components/FormField';
import { Icon } from '@/shared/components/Icon';

import { getRemoteProfile, type RemoteProfile, remotePhotoUrl } from './api/account';
import { type RemoteErrors } from './api/client';
import {
  formatDueDate,
  getRemoteTaskOptions,
  getRemoteTasks,
  type RemoteOption,
  type RemoteTask,
  type RemoteTaskInput,
  saveRemoteTask,
  validateRemoteTask,
} from './api/tasks';

type Data = {
  tasks: RemoteTask[];
  statuses: RemoteOption[];
  priorities: RemoteOption[];
  profile: RemoteProfile | null;
};
type State =
  { status: 'loading' } | { status: 'error'; message: string } | ({ status: 'ready' } & Data);
type Editing = { task: RemoteTask | null };
type Notice = { ok: boolean; message: string };

const priorityColors = ['#98B777', '#E3B84A', '#E58A4E', '#C8553D'];
const priorityTints = ['#EAF2DF', '#FBF0CF', '#FBE3D3', '#F9E0DA'];
const colorAt = (colors: string[], options: RemoteOption[], id: number) =>
  colors[
    Math.min(
      Math.max(
        options.findIndex((option) => option.id === id),
        0
      ),
      colors.length - 1
    )
  ];

function isOverdue(task: RemoteTask) {
  if (!task.dueDate || task.completedAt) return false;
  const now = new Date();
  return (
    new Date(task.dueDate).getTime() < Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );
}

function OptionPicker({
  label,
  options,
  value,
  error,
  disabled,
  onChange,
}: {
  label: string;
  options: RemoteOption[];
  value: number;
  error?: string;
  disabled: boolean;
  onChange: (id: number) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-[13px] font-medium text-forest">{label}</Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange(option.id)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              className={`min-h-11 justify-center rounded-full border px-4 ${selected ? 'border-forest bg-forest' : 'border-line bg-white active:bg-canvas'}`}>
              <Text
                className={`text-[13px] ${selected ? 'font-semibold text-accent' : 'text-ink'}`}>
                {option.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!!error && (
        <Text accessibilityLiveRegion="polite" className="text-xs leading-4 text-[#A23C30]">
          {error}
        </Text>
      )}
    </View>
  );
}

function Stat({ value, label, alert = false }: { value: number; label: string; alert?: boolean }) {
  return (
    <View className="flex-1 rounded-2xl bg-[#31493D] px-3 py-3">
      <Text
        className={`text-[22px] font-semibold ${alert && value > 0 ? 'text-peach' : 'text-white'}`}>
        {value}
      </Text>
      <Text className="mt-0.5 text-[11px] text-[#C4D0BE]">{label}</Text>
    </View>
  );
}

function TaskCard({
  task,
  priorities,
  onPress,
}: {
  task: RemoteTask;
  priorities: RemoteOption[];
  onPress: () => void;
}) {
  const due = formatDueDate(task.dueDate);
  const overdue = isOverdue(task);
  const done = !!task.completedAt;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Змінити задачу ${task.title}`}
      className={`flex-row gap-4 overflow-hidden rounded-3xl border border-line bg-white p-4 active:bg-canvas ${done ? 'opacity-70' : ''}`}>
      <View
        style={{ backgroundColor: colorAt(priorityColors, priorities, task.priorityId) }}
        className="w-1.5 self-stretch rounded-full"
      />
      <View className="min-w-0 flex-1">
        <View className="flex-row items-start gap-3">
          <View
            className={`mt-0.5 h-6 w-6 items-center justify-center rounded-full border ${done ? 'border-forest bg-forest' : 'border-[#C9CFC2] bg-white'}`}>
            {done && <Icon name="check" size={14} color="#DDF69A" />}
          </View>
          <Text
            className={`min-w-0 flex-1 text-[16px] font-semibold leading-6 ${done ? 'text-[#7A8177] line-through' : 'text-ink'}`}>
            {task.title}
          </Text>
          <Icon name="edit" size={17} color="#A3A99E" />
        </View>
        {!!task.description && (
          <Text numberOfLines={2} className="mt-2 text-[13px] leading-5 text-[#656D62]">
            {task.description}
          </Text>
        )}
        <View className="mt-3 flex-row flex-wrap items-center gap-2">
          <Text className="overflow-hidden rounded-full bg-[#ECEFE5] px-3 py-1 text-xs font-medium text-forest">
            {task.status}
          </Text>
          <Text
            style={{ backgroundColor: colorAt(priorityTints, priorities, task.priorityId) }}
            className="overflow-hidden rounded-full px-3 py-1 text-xs font-medium text-ink">
            {task.priority}
          </Text>
          {!!due && (
            <Text
              className={`overflow-hidden rounded-full px-3 py-1 text-xs font-medium ${overdue ? 'bg-[#F9E0DA] text-[#A23C30]' : 'border border-line text-[#656D62]'}`}>
              {overdue ? `прострочено · ${due}` : `до ${due}`}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export function RemoteTasksScreen({
  token,
  welcome,
  onSignOut,
}: {
  token: string;
  welcome?: string | null;
  onSignOut: (message?: string) => void;
}) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState(0);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [values, setValues] = useState<RemoteTaskInput>({
    title: '',
    description: '',
    dueDate: '',
    statusId: 0,
    priorityId: 0,
  });
  const [errors, setErrors] = useState<RemoteErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(
    welcome ? { ok: true, message: welcome } : null
  );
  const [photoFailed, setPhotoFailed] = useState(false);
  const pendingSave = useRef<AbortController | null>(null);
  const titleRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const dueDateRef = useRef<TextInput>(null);

  useEffect(() => () => pendingSave.current?.abort(), []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getRemoteTasks(token, controller.signal),
      getRemoteTaskOptions(token, controller.signal),
      getRemoteProfile(token, controller.signal),
    ])
      .then(([tasks, options, profile]) => {
        if (controller.signal.aborted) return;
        const failed = !tasks.ok ? tasks : !options.ok ? options : null;
        if (failed) {
          if (failed.status === 401) onSignOut(failed.message);
          else setState({ status: 'error', message: failed.message });
        } else if (tasks.ok && options.ok)
          setState({
            status: 'ready',
            tasks: tasks.tasks,
            statuses: options.statuses,
            priorities: options.priorities,
            profile: profile.ok ? profile.profile : null,
          });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [token, attempt, onSignOut]);

  function open(task: RemoteTask | null) {
    if (state.status !== 'ready') return;
    setEditing({ task });
    setValues(
      task
        ? {
            title: task.title,
            description: task.description ?? '',
            dueDate: formatDueDate(task.dueDate),
            statusId: task.statusId,
            priorityId: task.priorityId,
          }
        : {
            title: '',
            description: '',
            dueDate: '',
            statusId: state.statuses[0]?.id ?? 0,
            priorityId: state.priorities[0]?.id ?? 0,
          }
    );
    setErrors({});
    setSubmitted(false);
    setNotice(null);
  }

  function close() {
    if (pendingSave.current) return;
    Keyboard.dismiss();
    setEditing(null);
    setNotice(null);
  }

  function update<Field extends keyof RemoteTaskInput>(
    field: Field,
    value: RemoteTaskInput[Field]
  ) {
    const next = { ...values, [field]: value };
    setValues(next);
    setNotice(null);
    if (submitted) setErrors(validateRemoteTask(next));
  }

  function focusField(found: RemoteErrors) {
    if (found.title) titleRef.current?.focus();
    else if (found.description) descriptionRef.current?.focus();
    else if (found.dueDate) dueDateRef.current?.focus();
  }

  async function save() {
    if (pendingSave.current || !editing || state.status !== 'ready') return;
    const nextErrors = validateRemoteTask(values);
    setSubmitted(true);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return focusField(nextErrors);
    Keyboard.dismiss();
    const controller = new AbortController();
    pendingSave.current = controller;
    setIsSaving(true);
    setNotice(null);
    try {
      const result = await saveRemoteTask(
        token,
        editing.task?.id ?? null,
        values,
        controller.signal
      );
      if (controller.signal.aborted) return;
      if (result.ok) {
        const saved = result.task;
        setState({
          ...state,
          tasks: editing.task
            ? state.tasks.map((task) => (task.id === saved.id ? saved : task))
            : [saved, ...state.tasks],
        });
        setEditing(null);
        if (filter && filter !== saved.statusId) setFilter(0);
        setNotice({ ok: true, message: editing.task ? 'Зміни збережено.' : 'Задачу створено.' });
      } else if (result.status === 401) onSignOut(result.message);
      else {
        if (result.fields) {
          setErrors(result.fields);
          focusField(result.fields);
        }
        setNotice({ ok: false, message: result.message });
      }
    } catch {
    } finally {
      pendingSave.current = null;
      if (!controller.signal.aborted) setIsSaving(false);
    }
  }

  const banner = notice && (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={`flex-row items-start gap-3 rounded-2xl p-4 ${notice.ok ? 'bg-[#E4F2D2]' : 'bg-[#F9E7E2]'}`}>
      <Icon
        name={notice.ok ? 'check' : 'close'}
        size={19}
        color={notice.ok ? '#2F6B3A' : '#A23C30'}
      />
      <Text
        className={`flex-1 text-sm leading-5 ${notice.ok ? 'text-[#2F6B3A]' : 'text-[#A23C30]'}`}>
        {notice.message}
      </Text>
    </View>
  );

  const ready = state.status === 'ready' ? state : null;
  const total = ready?.tasks.length ?? 0;
  const done = ready?.tasks.filter((task) => task.completedAt).length ?? 0;
  const overdue = ready?.tasks.filter(isOverdue).length ?? 0;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const visible = ready?.tasks.filter((task) => !filter || task.statusId === filter) ?? [];
  const photo = ready?.profile && !photoFailed ? remotePhotoUrl(ready.profile.image, 64) : null;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerClassName="grow items-center p-5 pb-28 sm:p-8 sm:pb-28">
          <View className="w-full max-w-[520px] py-3">
            <View className="flex-row items-center gap-3">
              {!editing &&
                (photo ? (
                  <Image
                    source={{ uri: photo }}
                    onError={() => setPhotoFailed(true)}
                    accessibilityIgnoresInvertColors
                    className="h-12 w-12 rounded-full bg-[#ECEFE5]"
                  />
                ) : (
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-accent">
                    <Icon name="leaf" size={26} />
                  </View>
                ))}
              <View className="min-w-0 flex-1">
                {!editing && (
                  <Text numberOfLines={1} className="text-[13px] text-[#656D62]">
                    {ready?.profile?.firstName ? `Привіт, ${ready.profile.firstName}` : 'Привіт'}
                  </Text>
                )}
                <Text
                  accessibilityRole="header"
                  className="text-[30px] font-semibold leading-[36px] tracking-[-1px] text-forest">
                  {editing ? (editing.task ? 'Змінити задачу' : 'Нова задача') : 'Мої задачі'}
                </Text>
              </View>
              {editing && (
                <Pressable
                  onPress={close}
                  disabled={isSaving}
                  accessibilityRole="button"
                  accessibilityLabel="Скасувати і повернутися до списку"
                  className="h-11 w-11 items-center justify-center rounded-xl border border-line bg-white active:bg-canvas">
                  <Icon name="close" size={19} color="#253D32" />
                </Pressable>
              )}
            </View>

            {state.status === 'loading' && (
              <View className="mt-8 items-center rounded-[28px] border border-line bg-white p-10">
                <ActivityIndicator color="#253D32" />
                <Text className="mt-4 text-sm text-[#656D62]">Завантажуємо задачі…</Text>
              </View>
            )}

            {state.status === 'error' && (
              <View className="mt-8">
                <Text
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  className="rounded-2xl bg-[#F9E7E2] p-4 text-sm leading-5 text-[#A23C30]">
                  {state.message}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setState({ status: 'loading' });
                    setAttempt((current) => current + 1);
                  }}
                  className="mt-4 min-h-14 items-center justify-center rounded-2xl bg-forest px-5 active:opacity-80">
                  <Text className="text-[15px] font-semibold text-accent">Спробувати ще раз</Text>
                </Pressable>
              </View>
            )}

            {ready && editing && (
              <View className="mt-7 gap-4">
                <FormField
                  editable={!isSaving}
                  nativeID="task-title"
                  label="Назва"
                  icon="tasks"
                  placeholder="Що потрібно зробити?"
                  value={values.title}
                  onChangeText={(value) => update('title', value)}
                  error={errors.title}
                  inputRef={titleRef}
                  maxLength={200}
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => descriptionRef.current?.focus()}
                />
                <FormField
                  editable={!isSaving}
                  nativeID="task-description"
                  label="Опис (необов’язково)"
                  icon="edit"
                  placeholder="Деталі задачі"
                  value={values.description}
                  onChangeText={(value) => update('description', value)}
                  error={errors.description}
                  inputRef={descriptionRef}
                  maxLength={2000}
                  multiline
                />
                <FormField
                  editable={!isSaving}
                  nativeID="task-due-date"
                  label="Термін (необов’язково)"
                  icon="sun"
                  placeholder="ДД.ММ.РРРР"
                  value={values.dueDate}
                  onChangeText={(value) => update('dueDate', value)}
                  error={errors.dueDate}
                  inputRef={dueDateRef}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  returnKeyType="done"
                />
                <OptionPicker
                  label="Статус"
                  options={ready.statuses}
                  value={values.statusId}
                  error={errors.statusId}
                  disabled={isSaving}
                  onChange={(id) => update('statusId', id)}
                />
                <OptionPicker
                  label="Пріоритет"
                  options={ready.priorities}
                  value={values.priorityId}
                  error={errors.priorityId}
                  disabled={isSaving}
                  onChange={(id) => update('priorityId', id)}
                />
                {banner}
                <Pressable
                  accessibilityRole="button"
                  onPress={save}
                  disabled={isSaving}
                  aria-busy={isSaving}
                  className={`mt-2 min-h-14 flex-row items-center justify-center gap-3 rounded-2xl bg-forest px-5 active:opacity-80 ${isSaving ? 'opacity-70' : ''}`}>
                  <Text className="text-[15px] font-semibold text-accent">
                    {isSaving ? 'Зберігаємо…' : editing.task ? 'Зберегти зміни' : 'Створити задачу'}
                  </Text>
                  {isSaving ? (
                    <ActivityIndicator color="#DDF69A" size="small" />
                  ) : (
                    <Icon name="check" size={19} color="#DDF69A" />
                  )}
                </Pressable>
              </View>
            )}

            {ready && !editing && (
              <View className="mt-6 gap-4">
                {banner}
                <View className="overflow-hidden rounded-[28px] bg-forest p-6">
                  <View className="flex-row items-end justify-between">
                    <View>
                      <Text className="text-[11px] font-semibold tracking-[2px] text-accent">
                        ПРОГРЕС
                      </Text>
                      <Text className="mt-2 text-[40px] font-semibold leading-[44px] tracking-[-1.5px] text-white">
                        {done}
                        <Text className="text-[22px] text-[#C4D0BE]"> / {total}</Text>
                      </Text>
                      <Text className="mt-1 text-[13px] text-[#C4D0BE]">
                        {total === 0
                          ? 'Додай першу задачу'
                          : done === total
                            ? 'Усе виконано. Чудова робота!'
                            : 'задач виконано'}
                      </Text>
                    </View>
                    <Text className="text-[26px] font-semibold text-accent">{percent}%</Text>
                  </View>
                  <View
                    accessibilityRole="progressbar"
                    accessibilityValue={{ min: 0, max: 100, now: percent }}
                    className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#49604E]">
                    <View
                      style={{ width: `${percent}%` }}
                      className="h-full rounded-full bg-accent"
                    />
                  </View>
                  <View className="mt-5 flex-row gap-2">
                    <Stat value={total - done} label="попереду" />
                    <Stat value={overdue} label="прострочено" alert />
                    <Stat value={done} label="виконано" />
                  </View>
                </View>

                {total > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    accessibilityRole="tablist"
                    className="-mx-5"
                    contentContainerClassName="gap-2 px-5">
                    {[{ id: 0, name: 'Усі' }, ...ready.statuses].map((option) => {
                      const selected = filter === option.id;
                      const count = option.id
                        ? ready.tasks.filter((task) => task.statusId === option.id).length
                        : total;
                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => setFilter(option.id)}
                          accessibilityRole="tab"
                          aria-selected={selected}
                          className={`min-h-11 flex-row items-center gap-2 rounded-full border px-4 ${selected ? 'border-forest bg-forest' : 'border-line bg-white active:bg-canvas'}`}>
                          <Text
                            className={`text-[13px] ${selected ? 'font-semibold text-accent' : 'text-ink'}`}>
                            {option.name}
                          </Text>
                          <Text
                            className={`text-[12px] ${selected ? 'text-[#C4D0BE]' : 'text-[#8B9185]'}`}>
                            {count}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}

                {total === 0 ? (
                  <View className="items-center rounded-[28px] border border-dashed border-[#C9CFC2] px-6 py-10">
                    <View className="h-16 w-16 items-center justify-center rounded-full bg-accent">
                      <Icon name="leaf" size={34} />
                    </View>
                    <Text className="mt-5 text-center text-[18px] font-semibold text-forest">
                      Тут з’являться твої задачі
                    </Text>
                    <Text className="mt-2 text-center text-[13px] leading-5 text-[#656D62]">
                      Почни з однієї маленької справи — далі піде легше.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => open(null)}
                      className="mt-6 min-h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-forest px-6 active:opacity-80">
                      <Icon name="plus" size={18} color="#DDF69A" />
                      <Text className="text-[14px] font-semibold text-accent">Створити задачу</Text>
                    </Pressable>
                  </View>
                ) : visible.length === 0 ? (
                  <Text className="py-8 text-center text-sm leading-6 text-[#656D62]">
                    У цьому статусі задач немає.
                  </Text>
                ) : (
                  <View className="gap-3">
                    {visible.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        priorities={ready.priorities}
                        onPress={() => open(task)}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {ready && !editing && total > 0 && (
        <Pressable
          onPress={() => open(null)}
          accessibilityRole="button"
          accessibilityLabel="Нова задача"
          style={{
            shadowColor: '#253D32',
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
          className="absolute bottom-5 right-5 h-16 w-16 items-center justify-center rounded-full bg-accent active:opacity-80">
          <Icon name="plus" size={28} color="#253D32" />
        </Pressable>
      )}
    </SafeAreaView>
  );
}
