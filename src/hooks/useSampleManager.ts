import { useState, useCallback, useEffect } from 'react';
import { Sample, Box, Shelf, LogEntry, AppState } from '@/types/sample';
import { toast } from 'sonner';

export function useSampleManager() {
  const [state, setState] = useState<AppState>(() => {
    const stored = localStorage.getItem('sampleManagerState');
    return stored ? JSON.parse(stored) : {
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
    };
  });

  // Load state from Electron store on mount
  useEffect(() => {
    const loadStateFromElectron = async () => {
      if (window.electronAPI) {
        try {
          const electronState = await window.electronAPI.dbGet('appState');
          if (electronState) {
            setState(electronState);
          }
        } catch (error) {
          console.error('Failed to load state from Electron:', error);
        }
      }
    };

    loadStateFromElectron();
  }, []);

  // Save state to both localStorage and Electron store
  const saveState = useCallback(async (newState: AppState) => {
    localStorage.setItem('sampleManagerState', JSON.stringify(newState));
    
    if (window.electronAPI) {
      try {
        await window.electronAPI.dbSet('appState', newState);
      } catch (error) {
        console.error('Failed to save state to Electron:', error);
      }
    }
  }, []);

  const addLog = useCallback(async (action: string, details: string, itemType: 'shelf' | 'box' | 'sample', itemCode: string) => {
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

    setState(prev => {
      const newState = {
        ...prev,
        logs: [logEntry, ...prev.logs]
      };
      saveState(newState);
      return newState;
    });

    // Also save to Electron audit log
    if (window.electronAPI) {
      try {
        await window.electronAPI.dbPushLog(logEntry);
      } catch (error) {
        console.error('Failed to write audit log:', error);
      }
    }
  }, [state.currentOperator, saveState]);

  const login = useCallback((operator: string) => {
    setState(prev => {
      const newState = { ...prev, currentOperator: operator };
      saveState(newState);
      return newState;
    });
    addLog('LOGIN', `Operatore ${operator} ha effettuato l'accesso`, 'shelf', '');
  }, [addLog, saveState]);

  const logout = useCallback(() => {
    if (state.currentOperator) {
      addLog('LOGOUT', `Operatore ${state.currentOperator} ha effettuato il logout`, 'shelf', '');
    }
    setState(prev => {
      const newState = { ...prev, currentOperator: null };
      saveState(newState);
      return newState;
    });
  }, [state.currentOperator, addLog, saveState]);

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
          break;
          
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
          break;
          
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
          break;
      }
      
      saveState(newState);
      return newState;
    });
  }, [addLog, saveState]);

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
      
      const newState = {
        ...prev,
        shelves: [...prev.shelves, shelf]
      };
      saveState(newState);
      return newState;
    });
  }, [addLog, saveState]);

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

      const newState = {
        ...prev,
        shelves: newShelves
      };
      saveState(newState);
      return newState;
    });
  }, [addLog, saveState]);

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

      const newState = {
        ...prev,
        shelves: newShelves
      };
      saveState(newState);
      return newState;
    });
  }, [addLog, saveState]);

  const renameSample = useCallback((sampleId: string, newCode: string) => {
    setState(prev => {
      const newShelves = prev.shelves.map(shelf => ({
        ...shelf,
        boxes: shelf.boxes.map(box => ({
          ...box,
          samples: box.samples.map(sample => 
            sample.id === sampleId 
              ? { ...sample, code: newCode }
              : sample
          )
        }))
      }));

      const sample = prev.shelves.flatMap(s => s.boxes.flatMap(b => b.samples)).find(s => s.id === sampleId);
      if (sample) {
        addLog('CAMPIONE_RINOMINATO', `Campione rinominato da ${sample.code} a ${newCode}`, 'sample', newCode);
        toast.success(`Campione rinominato: ${newCode}`);
      }

      const newState = { ...prev, shelves: newShelves };
      saveState(newState);
      return newState;
    });
  }, [addLog, saveState]);

  const renameBox = useCallback((boxId: string, newCode: string) => {
    setState(prev => {
      const newShelves = prev.shelves.map(shelf => ({
        ...shelf,
        boxes: shelf.boxes.map(box => 
          box.id === boxId 
            ? { ...box, code: newCode }
            : box
        )
      }));

      const box = prev.shelves.flatMap(s => s.boxes).find(b => b.id === boxId);
      if (box) {
        addLog('CASSETTA_RINOMINATA', `Cassetta rinominata da ${box.code} a ${newCode}`, 'box', newCode);
        toast.success(`Cassetta rinominata: ${newCode}`);
      }

      const newState = { ...prev, shelves: newShelves };
      saveState(newState);
      return newState;
    });
  }, [addLog, saveState]);

  const renameShelf = useCallback((shelfId: string, newCode: string) => {
    setState(prev => {
      const newShelves = prev.shelves.map(shelf => 
        shelf.id === shelfId 
          ? { ...shelf, code: newCode }
          : shelf
      );

      const shelf = prev.shelves.find(s => s.id === shelfId);
      if (shelf) {
        addLog('SCAFFALE_RINOMINATO', `Scaffale rinominato da ${shelf.code} a ${newCode}`, 'shelf', newCode);
        toast.success(`Scaffale rinominato: ${newCode}`);
      }

      const newState = { ...prev, shelves: newShelves };
      saveState(newState);
      return newState;
    });
  }, [addLog, saveState]);

  const moveSample = useCallback((sampleId: string, targetBoxId: string) => {
    setState(prev => {
      let movedSample: Sample | null = null;
      let sourceBox: Box | null = null;
      let sourceShelf: Shelf | null = null;
      
      // Remove sample from source
      const newShelves = prev.shelves.map(shelf => ({
        ...shelf,
        boxes: shelf.boxes.map(box => {
          const filteredSamples = box.samples.filter(sample => {
            if (sample.id === sampleId) {
              movedSample = sample;
              sourceBox = box;
              sourceShelf = shelf;
              return false;
            }
            return true;
          });
          return { ...box, samples: filteredSamples };
        })
      }));

      // Add sample to target box
      if (movedSample) {
        const targetShelf = newShelves.find(shelf => shelf.boxes.some(box => box.id === targetBoxId));
        const targetBox = targetShelf?.boxes.find(box => box.id === targetBoxId);
        
        if (targetBox && targetShelf) {
          targetBox.samples.push({ ...movedSample, boxId: targetBoxId, shelfId: targetShelf.id });
          
          addLog('CAMPIONE_SPOSTATO', 
            `Campione spostato: ${movedSample.code} da cassetta ${sourceBox?.code} a cassetta ${targetBox.code}`,
            'sample', 
            movedSample.code
          );
          toast.success(`Campione spostato nella cassetta ${targetBox.code}`);
        }
      }

      const newState = { ...prev, shelves: newShelves };
      saveState(newState);
      return newState;
    });
  }, [addLog, saveState]);

  const moveBox = useCallback((boxId: string, targetShelfId: string) => {
    setState(prev => {
      let movedBox: Box | null = null;
      let sourceShelf: Shelf | null = null;
      
      // Remove box from source shelf
      const newShelves = prev.shelves.map(shelf => {
        const filteredBoxes = shelf.boxes.filter(box => {
          if (box.id === boxId) {
            movedBox = box;
            sourceShelf = shelf;
            return false;
          }
          return true;
        });
        return { ...shelf, boxes: filteredBoxes };
      });

      // Add box to target shelf
      if (movedBox) {
        const targetShelf = newShelves.find(shelf => shelf.id === targetShelfId);
        if (targetShelf) {
          targetShelf.boxes.push({ ...movedBox, shelfId: targetShelfId });
          
          addLog('CASSETTA_SPOSTATA', 
            `Cassetta spostata: ${movedBox.code} da scaffale ${sourceShelf?.code} a scaffale ${targetShelf.code}`,
            'box', 
            movedBox.code
          );
          toast.success(`Cassetta spostata nello scaffale ${targetShelf.code}`);
        }
      }

      const newState = { ...prev, shelves: newShelves };
      saveState(newState);
      return newState;
    });
  }, [addLog, saveState]);

  const bulkDispose = useCallback((selectedItems: { shelves: string[], boxes: string[], samples: string[] }) => {
    setState(prev => {
      const newState = { ...prev };
      
      // Dispose samples
      selectedItems.samples.forEach(sampleId => {
        newState.shelves.forEach(shelf => {
          shelf.boxes.forEach(box => {
            const sample = box.samples.find(s => s.id === sampleId);
            if (sample) {
              sample.status = 'disposed';
              sample.disposedAt = new Date();
              addLog('CAMPIONE_SMALTITO', 
                `Campione smaltito: ${sample.code} da cassetta ${box.code} di scaffale ${shelf.code}`,
                'sample', 
                sample.code
              );
            }
          });
        });
      });

      // Dispose boxes
      selectedItems.boxes.forEach(boxId => {
        newState.shelves.forEach(shelf => {
          const box = shelf.boxes.find(b => b.id === boxId);
          if (box) {
            box.status = 'disposed';
            box.samples.forEach(sample => {
              sample.status = 'disposed';
              sample.disposedAt = new Date();
            });
            addLog('CASSETTA_SMALTITA', 
              `Cassetta smaltita: ${box.code} da scaffale ${shelf.code}`,
              'box', 
              box.code
            );
          }
        });
      });

      // Dispose shelves
      selectedItems.shelves.forEach(shelfId => {
        const shelf = newState.shelves.find(s => s.id === shelfId);
        if (shelf) {
          shelf.status = 'disposed';
          shelf.boxes.forEach(box => {
            box.status = 'disposed';
            box.samples.forEach(sample => {
              sample.status = 'disposed';
              sample.disposedAt = new Date();
            });
          });
          addLog('SCAFFALE_SMALTITO', `Scaffale smaltito: ${shelf.code}`, 'shelf', shelf.code);
        }
      });

      saveState(newState);
      return newState;
    });
    
    toast.success('Elementi smaltiti con successo');
  }, [addLog, saveState]);

  const bulkDelete = useCallback(async (selectedItems: { shelves: string[], boxes: string[], samples: string[] }, password: string) => {
    // Verify password using Electron API if available
    if (window.electronAPI) {
      try {
        const isValid = await window.electronAPI.verifyPassword(password);
        if (!isValid) {
          toast.error('Password non corretta');
          return false;
        }
      } catch (error) {
        toast.error('Errore nella verifica password');
        return false;
      }
    } else {
      // Fallback for web version
      if (password !== state.settings.deletePassword) {
        toast.error('Password non corretta');
        return false;
      }
    }

    setState(prev => {
      const newState = { ...prev };
      
      // Delete samples
      selectedItems.samples.forEach(sampleId => {
        newState.shelves.forEach(shelf => {
          shelf.boxes.forEach(box => {
            const sampleIndex = box.samples.findIndex(s => s.id === sampleId);
            if (sampleIndex !== -1) {
              const sample = box.samples[sampleIndex];
              addLog('CAMPIONE_ELIMINATO', 
                `Campione eliminato: ${sample.code} da cassetta ${box.code} di scaffale ${shelf.code}`,
                'sample', 
                sample.code
              );
              box.samples.splice(sampleIndex, 1);
            }
          });
        });
      });

      // Delete boxes
      selectedItems.boxes.forEach(boxId => {
        newState.shelves.forEach(shelf => {
          const boxIndex = shelf.boxes.findIndex(b => b.id === boxId);
          if (boxIndex !== -1) {
            const box = shelf.boxes[boxIndex];
            addLog('CASSETTA_ELIMINATA', 
              `Cassetta eliminata: ${box.code} da scaffale ${shelf.code} (con ${box.samples.length} campioni)`,
              'box', 
              box.code
            );
            shelf.boxes.splice(boxIndex, 1);
          }
        });
      });

      // Delete shelves
      selectedItems.shelves.forEach(shelfId => {
        const shelfIndex = newState.shelves.findIndex(s => s.id === shelfId);
        if (shelfIndex !== -1) {
          const shelf = newState.shelves[shelfIndex];
          const totalSamples = shelf.boxes.reduce((acc, box) => acc + box.samples.length, 0);
          addLog('SCAFFALE_ELIMINATO', 
            `Scaffale eliminato: ${shelf.code} (con ${shelf.boxes.length} cassette e ${totalSamples} campioni)`,
            'shelf', 
            shelf.code
          );
          newState.shelves.splice(shelfIndex, 1);
        }
      });

      saveState(newState);
      return newState;
    });
    
    toast.success('Elementi eliminati con successo');
    return true;
  }, [addLog, saveState, state.settings.deletePassword]);

  const updateSettings = useCallback((settings: AppState['settings']) => {
    setState(prev => {
      const newState = { ...prev, settings };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Export database function
  const exportDB = useCallback(async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.dbExport();
        if (result.success) {
          addLog('DB_EXPORT', `Database esportato in: ${result.path}`, 'sample', '');
          toast.success('Database esportato con successo');
          return { success: true, message: 'Database esportato con successo' };
        }
        return { success: false, message: 'Esportazione annullata' };
      } catch (error) {
        return { success: false, message: `Errore durante l'esportazione: ${error}` };
      }
    } else {
      // Fallback for web version
      const dataStr = JSON.stringify(state, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `sample-buddy-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      addLog('DB_EXPORT', 'Database esportato (web)', 'sample', '');
      toast.success('Database esportato con successo');
      return { success: true, message: 'Database esportato con successo' };
    }
  }, [state, addLog]);

  // Import database function
  const importDB = useCallback(async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.dbImport();
        if (result.success) {
          // Reload the state after import
          const electronState = await window.electronAPI.dbGet('appState');
          if (electronState) {
            setState(electronState);
            addLog('DB_IMPORT', `Database importato da: ${result.path}`, 'sample', '');
            toast.success('Database importato con successo');
            return { success: true, message: 'Database importato con successo' };
          }
        }
        return { success: false, message: result.error || 'Importazione annullata' };
      } catch (error) {
        return { success: false, message: `Errore durante l'importazione: ${error}` };
      }
    } else {
      // Fallback for web version
      toast.error('Importazione non disponibile nella versione web');
      return { success: false, message: 'Importazione non disponibile nella versione web' };
    }
  }, [addLog]);

  const moveItems = useCallback((type: 'sample' | 'box', itemIds: string[], targetId: string) => {
    if (type === 'sample') {
      itemIds.forEach(sampleId => moveSample(sampleId, targetId));
    } else if (type === 'box') {
      itemIds.forEach(boxId => moveBox(boxId, targetId));
    }
  }, [moveSample, moveBox]);

  return {
    state,
    setState,
    addLog,
    login,
    logout,
    scanCode,
    createShelf,
    createBox,
    createSample,
    renameSample,
    renameBox,
    renameShelf,
    moveSample,
    moveBox,
    bulkDispose,
    bulkDelete,
    moveItems,
    updateSettings,
    exportDB,
    importDB
  };
}