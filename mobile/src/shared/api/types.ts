export type UserProfile = { id: string; name: string; email: string; photo: string | null };
export type PhotoInput = { uri: string; name: string; type: string; file?: Blob };
export type Task = {
  id: string;
  title: string;
  category: 'Робота' | 'Особисте';
  minutes: number;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
};
export type TaskInput = Pick<Task, 'title' | 'category' | 'minutes' | 'completed'>;
export type FocusSession = { id: string; minutes: number; completedAt: string };
export type Workspace = {
  tasks: Task[];
  sessions: FocusSession[];
  timer: { durationMinutes: number; remainingMs: number; deadline: number | null; runId: string };
  serverNow: number;
};
