export type NotificationType = 'invitation' | 'message' | 'alert' | 'achievement' | 'task_reminder';

export interface BaseNotification {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: Date;
  read: boolean;
}

export interface InvitationNotification extends BaseNotification {
  type: 'invitation';
  action: 'view_invitation';
  data: {
    invitationId: string;
    token: string;
    homeName: string;
    homeId: string;
    ownerName?: string;
  };
}

export interface MessageNotification extends BaseNotification {
  type: 'message';
  action?: never;
  data?: {
    title?: string;
  };
}

export interface AlertNotification extends BaseNotification {
  type: 'alert';
  action?: never;
  data?: {
    severity?: 'info' | 'warning' | 'error';
  };
}

export interface AchievementNotification extends BaseNotification {
  type: 'achievement';
  action?: 'view_achievement';
  data?: {
    achievementId?: string;
    achievementName?: string;
  };
}

export interface TaskReminderNotification extends BaseNotification {
  type: 'task_reminder';
  action?: 'view_task';
  data?: {
    taskId?: string;
    taskName?: string;
  };
}

export type Notification = 
  | InvitationNotification 
  | MessageNotification 
  | AlertNotification 
  | AchievementNotification 
  | TaskReminderNotification;
