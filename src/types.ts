export type TaskStatus = 'Todo' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  category: string | null;
  due_date: string | null;
  due_time: string | null;
  reminder: string | null;
  notes: string | null;
  status: TaskStatus;
  subtasks: Subtask[];
  created_at?: string;
}
