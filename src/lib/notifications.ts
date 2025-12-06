export type NotificationType = 'invitation' | 'message' | 'alert' | 'achievement' | 'task_reminder' | 'swap_request' | 'inconvenience';

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

export interface SwapRequestNotification extends BaseNotification {
  type: 'swap_request';
  action: 'view_swap_request';
  data: {
    requestId: number;
    requesterName: string;
    requesterTaskTitle: string;
    requesterTaskIcon: string;
    targetTaskTitle: string;
    targetTaskIcon: string;
  };
}

export interface InconvenienceNotification extends BaseNotification {
  type: 'inconvenience';
  action: 'view_inconvenience';
  data: {
    alertId: number;
    senderName: string;
    message: string;
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
  | SwapRequestNotification
  | InconvenienceNotification
  | MessageNotification 
  | AlertNotification 
  | AchievementNotification 
  | TaskReminderNotification;
