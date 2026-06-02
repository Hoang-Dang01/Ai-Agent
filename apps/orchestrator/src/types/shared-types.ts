export type TaskStatus = 'QUEUED' | 'DISPATCHED' | 'ACKNOWLEDGED' | 'EXECUTING' | 'RECOVERING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type AttemptStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ABORTED' | 'TIMED_OUT';

export interface TaskExecutionAttemptDTO {
  id: string;
  taskId: string;
  executionEpoch: number;
  workerInstanceId?: string;
  runtimeInstanceId?: string;
  runtimePid?: number;
  runtimeMachine?: string;
  startedAt: Date;
  endedAt?: Date;
  status: AttemptStatus;
  result?: any;
  error?: string;
}

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

  // Relation
  attempts?: TaskExecutionAttemptDTO[];

  // --- PHASE K: Workflow State Recovery & Distributed Leases ---
  executionEpoch?: number;
  lastHeartbeatAt?: Date;
  leaseExpiresAt?: Date;
  fencingToken?: string | number | bigint;
  runtimePid?: number;
  runtimeMachine?: string;
  workerInstanceId?: string;
  runtimeInstanceId?: string;

  // --- PHASE K: Dead Letter Queue & Retry Policy ---
  retryCount?: number;
  maxRetry?: number;
  deadLetteredAt?: Date;
  dlqReason?: string | null;
  lastError?: string | null;

  // --- PHASE N: Execution Journal & Rollback Preparation ---
  rollbackMetadata?: any;
  rollbackPossible?: boolean;

  // --- PHASE O: Idempotency & Deterministic Execution ---
  serviceName?: string;
  idempotencyKey?: string;
  executionFingerprint?: string;

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

export interface DAGTaskNode {
  id: string;          // Mã định danh node độc bản, ví dụ: "task_0"
  title: string;       // Tiêu đề nhiệm vụ dễ đọc, ví dụ: "Mở ứng dụng Notepad"
  toolName: string;    // Công cụ được chỉ định chạy, ví dụ: "OpenApplicationTool"
  args: Record<string, any>; // Các đối số truyền vào chạy công cụ
  dependencies: string[]; // Mảng chứa ID các tác vụ cha cần hoàn tất trước
}

export interface DAGTaskGraph {
  goal: string;
  tasks: DAGTaskNode[];
}
