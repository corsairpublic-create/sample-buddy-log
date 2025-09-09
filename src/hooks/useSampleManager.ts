import { useState, useCallback } from 'react';
import { Sample, Box, Shelf, LogEntry, AppState } from '@/types/sample';
import { toast } from 'sonner';

export function useSampleManager() {
  const [state, setState] = useState<AppState>({
    currentOperator: null,
    shelves: [],
    logs: [],
    settings: {
      deletePassword: 'Francimicrob',
      printerSettings: {
        defaultWidth: 4,
        defaultHeight: 2,
        selectedPrinter: ''
      }
    }
  });

  const addLog = useCallback((action: string, details: string, itemType: 'shelf' | 'box' | 'sample', itemCode: string) => {
    if (!state.currentOperator) return;
    
    const logEntry: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      operator: state.currentOperator,
      action,
      details,
      itemType,
      itemCode
    };

    setState(prev => ({
      ...prev,
      logs: [logEntry, ...prev.logs]
    }));
  }, [state.currentOperator]);

  const login = useCallback((operator: string) => {
    setState(prev => ({
      ...prev,
      currentOperator: operator
    }));
    addLog('LOGIN', `Operatore ${operator} ha effettuato l'accesso`, 'shelf', '');
  }, [addLog]);

  const logout = useCallback(() => {
    if (state.currentOperator) {
      addLog('LOGOUT', `Operatore ${state.currentOperator} ha effettuato il logout`, 'shelf', '');
    }
    setState(prev => ({
      ...prev,
      currentOperator: null
    }));
  }, [state.currentOperator, addLog]);

  const determineItemType = (code: string): 'shelf' | 'box' | 'sample' => {
    const upperCode = code.toUpperCase();
    if (upperCode.startsWith('SCAFFALE') || upperCode.startsWith('SC')) {
      return 'shelf';
    }
    if (upperCode.startsWith('CASSETTA') || upperCode.startsWith('CA') || upperCode.startsWith('AL')) {
      return 'box';
    }
    // Assume samples start with numbers and contain hyphen
    if (/^\d+.*-.*/.test(code)) {
      return 'sample';
    }
    return 'sample'; // default
  };

  const getSampleType = (shelfCode: string, boxCode: string): 'TQ' | 'MC' => {
    const shelfUpper = shelfCode.toUpperCase();
    const boxUpper = boxCode.toUpperCase();
    
    // If both shelf and box start with AL, then MC (macinato)
    if (shelfUpper.startsWith('AL') && boxUpper.startsWith('AL')) {
      return 'MC';
    }
    
    return 'TQ'; // tal quale for all other cases
  };

  const scanCode = useCallback((code: string, currentShelf?: string, currentBox?: string) => {
    const itemType = determineItemType(code);
    
    setState(prev => {
      const newState = { ...prev };
      
      switch (itemType) {
        case 'shelf':
          // Create or find shelf
          let shelf = newState.shelves.find(s => s.code === code);
          if (!shelf) {
            shelf = {
              id: Date.now().toString(),
              code,
              prefix: code.toUpperCase().startsWith('AL') ? 'AL' : code.toUpperCase().startsWith('SC') ? 'SC' : 'SCAFFALE',
              boxes: [],
              status: 'active',
              createdAt: new Date()
            };
            newState.shelves.push(shelf);
            addLog('SCAFFALE_CREATO', `Nuovo scaffale creato: ${code}`, 'shelf', code);
          }
          addLog('SCAFFALE_SCANSIONATO', `Scaffale scansionato: ${code}`, 'shelf', code);
          toast.success(`Scaffale scansionato: ${code}`);
          return newState;
          
        case 'box':
          if (!currentShelf) {
            toast.error('Devi prima scansionare uno scaffale');
            return prev;
          }
          
          const targetShelf = newState.shelves.find(s => s.code === currentShelf);
          if (!targetShelf) {
            toast.error('Scaffale non trovato');
            return prev;
          }
          
          let box = targetShelf.boxes.find(b => b.code === code);
          if (!box) {
            box = {
              id: Date.now().toString(),
              code,
              prefix: code.toUpperCase().startsWith('AL') ? 'AL' : code.toUpperCase().startsWith('CA') ? 'CA' : 'CASSETTA',
              shelfId: targetShelf.id,
              samples: [],
              status: 'active',
              createdAt: new Date()
            };
            targetShelf.boxes.push(box);
            addLog('CASSETTA_CREATA', `Nuova cassetta creata: ${code} in scaffale ${currentShelf}`, 'box', code);
          }
          addLog('CASSETTA_SCANSIONATA', `Cassetta scansionata: ${code} in scaffale ${currentShelf}`, 'box', code);
          toast.success(`Cassetta scansionata: ${code}`);
          return newState;
          
        case 'sample':
          if (!currentShelf || !currentBox) {
            toast.error('Devi prima scansionare scaffale e cassetta');
            return prev;
          }
          
          const sampleShelf = newState.shelves.find(s => s.code === currentShelf);
          const sampleBox = sampleShelf?.boxes.find(b => b.code === currentBox);
          
          if (!sampleShelf || !sampleBox) {
            toast.error('Scaffale o cassetta non trovati');
            return prev;
          }
          
          // Check if sample already exists
          const existingSample = sampleBox.samples.find(s => s.code === code);
          if (existingSample) {
            toast.error('Campione già esistente in questa cassetta');
            return prev;
          }
          
          const sampleType = getSampleType(currentShelf, currentBox);
          const formattedCode = `${code} ${sampleType}`;
          
          const sample: Sample = {
            id: Date.now().toString(),
            code: formattedCode,
            type: sampleType,
            shelfId: sampleShelf.id,
            boxId: sampleBox.id,
            status: 'active',
            createdAt: new Date()
          };
          
          sampleBox.samples.push(sample);
          addLog('CAMPIONE_ARCHIVIATO', `Campione archiviato: ${formattedCode} in cassetta ${currentBox} di scaffale ${currentShelf}`, 'sample', formattedCode);
          toast.success(`Campione archiviato: ${formattedCode}`);
          return newState;
      }
      
      return prev;
    });
  }, [addLog]);

  const createShelf = useCallback((code: string) => {
    setState(prev => {
      const exists = prev.shelves.find(s => s.code === code);
      if (exists) {
        toast.error('Scaffale già esistente');
        return prev;
      }

      const shelf: Shelf = {
        id: Date.now().toString(),
        code,
        prefix: code.toUpperCase().startsWith('AL') ? 'AL' : code.toUpperCase().startsWith('SC') ? 'SC' : 'SCAFFALE',
        boxes: [],
        status: 'active',
        createdAt: new Date()
      };

      addLog('SCAFFALE_CREATO_MANUALMENTE', `Scaffale creato manualmente: ${code}`, 'shelf', code);
      toast.success(`Scaffale creato: ${code}`);
      
      return {
        ...prev,
        shelves: [...prev.shelves, shelf]
      };
    });
  }, [addLog]);

  const createBox = useCallback((shelfCode: string, boxCode: string) => {
    setState(prev => {
      const shelf = prev.shelves.find(s => s.code === shelfCode);
      if (!shelf) {
        toast.error('Scaffale non trovato');
        return prev;
      }

      const exists = shelf.boxes.find(b => b.code === boxCode);
      if (exists) {
        toast.error('Cassetta già esistente in questo scaffale');
        return prev;
      }

      const box: Box = {
        id: Date.now().toString(),
        code: boxCode,
        prefix: boxCode.toUpperCase().startsWith('AL') ? 'AL' : boxCode.toUpperCase().startsWith('CA') ? 'CA' : 'CASSETTA',
        shelfId: shelf.id,
        samples: [],
        status: 'active',
        createdAt: new Date()
      };

      const newShelves = prev.shelves.map(s => 
        s.id === shelf.id 
          ? { ...s, boxes: [...s.boxes, box] }
          : s
      );

      addLog('CASSETTA_CREATA_MANUALMENTE', `Cassetta creata manualmente: ${boxCode} in scaffale ${shelfCode}`, 'box', boxCode);
      toast.success(`Cassetta creata: ${boxCode}`);

      return {
        ...prev,
        shelves: newShelves
      };
    });
  }, [addLog]);

  const createSample = useCallback((shelfCode: string, boxCode: string, sampleCode: string) => {
    setState(prev => {
      const shelf = prev.shelves.find(s => s.code === shelfCode);
      const box = shelf?.boxes.find(b => b.code === boxCode);
      
      if (!shelf || !box) {
        toast.error('Scaffale o cassetta non trovati');
        return prev;
      }

      const exists = box.samples.find(s => s.code.startsWith(sampleCode));
      if (exists) {
        toast.error('Campione già esistente');
        return prev;
      }

      const sampleType = getSampleType(shelfCode, boxCode);
      const formattedCode = `${sampleCode} ${sampleType}`;

      const sample: Sample = {
        id: Date.now().toString(),
        code: formattedCode,
        type: sampleType,
        shelfId: shelf.id,
        boxId: box.id,
        status: 'active',
        createdAt: new Date()
      };

      const newShelves = prev.shelves.map(s => 
        s.id === shelf.id 
          ? {
              ...s,
              boxes: s.boxes.map(b => 
                b.id === box.id 
                  ? { ...b, samples: [...b.samples, sample] }
                  : b
              )
            }
          : s
      );

      addLog('CAMPIONE_CREATO_MANUALMENTE', `Campione creato manualmente: ${formattedCode} in cassetta ${boxCode} di scaffale ${shelfCode}`, 'sample', formattedCode);
      toast.success(`Campione creato: ${formattedCode}`);

      return {
        ...prev,
        shelves: newShelves
      };
    });
  }, [addLog]);

  return {
    state,
    login,
    logout,
    scanCode,
    createShelf,
    createBox,
    createSample,
    addLog,
    setState
  };
}