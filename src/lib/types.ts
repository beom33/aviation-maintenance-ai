export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface WorkRecord {
  id: string;
  date: string;
  aircraftType: string;
  taskType: string;
  description: string;
  technician: string;
  status: 'completed' | 'in_progress' | 'deferred';
}
