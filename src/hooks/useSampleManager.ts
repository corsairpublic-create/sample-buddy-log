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

      return { ...prev, shelves: newShelves };
    });
  }, [addLog]);

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

      return { ...prev, shelves: newShelves };
    });
  }, [addLog]);

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

      return { ...prev, shelves: newShelves };
    });
  }, [addLog]);

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

      return { ...prev, shelves: newShelves };
    });
  }, [addLog]);

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

      return { ...prev, shelves: newShelves };
    });
  }, [addLog]);

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

      return newState;
    });

    toast.success('Elementi smaltiti con successo');
  }, [addLog]);

  const bulkDelete = useCallback((selectedItems: { shelves: string[], boxes: string[], samples: string[] }) => {
    setState(prev => {
      const newState = { ...prev };
      
      // Delete samples
      selectedItems.samples.forEach(sampleId => {
        newState.shelves.forEach(shelf => {
          shelf.boxes.forEach(box => {
            const sample = box.samples.find(s => s.id === sampleId);
            if (sample) {
              sample.status = 'deleted';
              sample.deletedAt = new Date();
              addLog('CAMPIONE_ELIMINATO', 
                `Campione eliminato: ${sample.code} da cassetta ${box.code} di scaffale ${shelf.code}`,
                'sample', 
                sample.code
              );
            }
          });
        });
      });

      // Delete boxes
      selectedItems.boxes.forEach(boxId => {
        newState.shelves.forEach(shelf => {
          const box = shelf.boxes.find(b => b.id === boxId);
          if (box) {
            box.status = 'deleted';
            box.samples.forEach(sample => {
              sample.status = 'deleted';
              sample.deletedAt = new Date();
            });
            addLog('CASSETTA_ELIMINATA', 
              `Cassetta eliminata: ${box.code} da scaffale ${shelf.code}`,
              'box', 
              box.code
            );
          }
        });
      });

      // Delete shelves
      selectedItems.shelves.forEach(shelfId => {
        const shelf = newState.shelves.find(s => s.id === shelfId);
        if (shelf) {
          shelf.status = 'deleted';
          shelf.boxes.forEach(box => {
            box.status = 'deleted';
            box.samples.forEach(sample => {
              sample.status = 'deleted';
              sample.deletedAt = new Date();
            });
          });
          addLog('SCAFFALE_ELIMINATO', `Scaffale eliminato: ${shelf.code}`, 'shelf', shelf.code);
        }
      });

      return newState;
    });

    toast.success('Elementi eliminati con successo');
  }, [addLog]);

  return {
    state,
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
    addLog,
    setState
  };
}