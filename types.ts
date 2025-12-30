
export enum Sender {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  timestamp: Date;
  isPRD?: boolean;
}

export interface PRDQuestion {
  id: string;
  text: string;
  options: string[];
}

export interface LeadData {
  name: string;
  phone: string;
  email: string;
  meetingTime?: string;
  projectGoal?: string;
  answers?: Record<string, string>;
}

export type ChatPhase = 'initial' | 'ask_name' | 'quiz' | 'show_timelines' | 'ask_contacts' | 'show_budgets' | 'scheduling' | 'completed';
