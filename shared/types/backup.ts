export interface DatabaseBackup {
  id: string;
  filename: string;
  createdAt: Date;
  size: number;
  tablesCount: number;
  recordsCount: number;
  version: string;
}

export interface BackupMetadata {
  timestamp: string;
  version: string;
  tables: {
    [tableName: string]: {
      recordCount: number;
      columns: string[];
    };
  };
}

export interface BackupResponse {
  success: boolean;
  message: string;
  backup?: DatabaseBackup;
  error?: string;
}

export interface RestoreResponse {
  success: boolean;
  message: string;
  recordsRestored?: {
    [tableName: string]: number;
  };
  error?: string;
}
