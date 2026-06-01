export type TaskStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface UserDTO {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDTO {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserGoalDTO {
  id: string;
  userId: string;
  goal: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

export interface AITaskDTO {
  id: string;
  goalId: string;
  parentId?: string;
  title: string;
  status: TaskStatus;
  payload?: any;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolExecutionDTO {
  id: string;
  taskId: string;
  toolName: string;
  args?: any;
  result?: any;
  riskLevel: 'SAFE' | 'WARNING' | 'CRITICAL';
  status: 'SUCCESS' | 'FAILED';
  createdAt: Date;
}

export interface WorldStateFrameDTO {
  id: string;
  toolExecutionId?: string;
  taskId?: string;
  screenshotUrl?: string;
  uiTreeXml?: string;
  createdAt: Date;
}
