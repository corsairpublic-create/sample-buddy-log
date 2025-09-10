declare global {
  interface Window {
    electronAPI?: {
      // Database operations
      dbGet: (key: string) => Promise<any>;
      dbSet: (key: string, value: any) => Promise<boolean>;
      dbPushLog: (logEntry: any) => Promise<boolean>;
      dbExport: () => Promise<{ success: boolean; path?: string; error?: string; cancelled?: boolean }>;
      dbImport: () => Promise<{ success: boolean; path?: string; error?: string; cancelled?: boolean }>;
      
      // Password management
      verifyPassword: (password: string) => Promise<boolean>;
      changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
      
      // Printer operations
      getPrinters: () => Promise<Array<{
        name: string;
        displayName: string;
        description: string;
        status: number;
        isDefault: boolean;
      }>>;
      print: (options: {
        html: string;
        printerName?: string;
        silent?: boolean;
      }) => Promise<{ success: boolean; error?: string }>;
      
      // Check if running in Electron
      isElectron: boolean;
    };
  }
}

export {};