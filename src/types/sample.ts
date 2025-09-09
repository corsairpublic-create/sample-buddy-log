export interface Sample {
  id: string;
  code: string;
  type: 'TQ' | 'MC';
  shelfId: string;
  boxId: string;
  status: 'active' | 'disposed' | 'deleted';
  createdAt: Date;
  disposedAt?: Date;
  deletedAt?: Date;
}

export interface Box {
  id: string;
  code: string;
  prefix: string;
  shelfId: string;
  samples: Sample[];
  status: 'active' | 'disposed' | 'deleted';
  createdAt: Date;
}

export interface Shelf {
  id: string;
  code: string;
  prefix: string;
  boxes: Box[];
  status: 'active' | 'disposed' | 'deleted';
  createdAt: Date;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  operator: string;
  action: string;
  details: string;
  itemType: 'shelf' | 'box' | 'sample';
  itemCode: string;
}

export interface AppState {
  currentOperator: string | null;
  shelves: Shelf[];
  logs: LogEntry[];
  settings: {
    deletePassword: string;
    printerSettings: {
      defaultWidth: number;
      defaultHeight: number;
      selectedPrinter: string;
    };
  };
}