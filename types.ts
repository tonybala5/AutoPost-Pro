
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  accessToken?: string; // Token real do Graph API
}

export interface SavedAccount {
  id: string;
  name: string;
  avatar: string;
  accessToken: string;
  savedAt: number;
}

export interface FacebookGroup {
  id: string;
  name: string;
  members: number;
  privacy: 'Public' | 'Private' | string;
  coverImage: string;
}

export interface SmartScheduleConfig {
  enabled: boolean;
  startTime: string; // "09:00"
  endTime: string;   // "11:00"
  maxPostsPerDay: number;
}

export interface BatchConfig {
  enabled: boolean;
  batchSize: number;      // Ex: A cada 5 posts
  coolDownSeconds: number; // Ex: Pausar por 600s (10 min)
}

export interface MemberFilterConfig {
  enabled: boolean;
  minMembers: number; // Ex: 1000 membros
}

export interface PostConfig {
  text: string;
  media?: File | null;
  mediaPreview?: string;
  mediaType?: 'image' | 'video';
  delaySeconds: number; 
  useRandomDelay: boolean;
  minDelay: number;
  maxDelay: number;
  scheduledTime?: Date | null;
  smartSchedule: SmartScheduleConfig;
  batchConfig: BatchConfig;
  memberFilterConfig: MemberFilterConfig; // Nova configuração de filtro
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  groupId: string;
  groupName: string;
  status: 'pending' | 'success' | 'error' | 'waiting' | 'scheduled' | 'skipped';
  message: string;
}

export enum AppState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD'
}