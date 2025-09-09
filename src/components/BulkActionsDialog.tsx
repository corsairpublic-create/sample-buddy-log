import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppState } from '@/types/sample';
import { toast } from 'sonner';

interface BulkActionsDialogProps {
  open: boolean;
  onClose: () => void;
  action: 'rename' | 'move' | null;
  selectedItems: {
    shelves: string[];
    boxes: string[];
    samples: string[];
  };
  state: AppState;
  onRename: (type: 'shelf' | 'box' | 'sample', id: string, newCode: string) => void;
  onMove: (type: 'box' | 'sample', id: string, targetId: string) => void;
}

export function BulkActionsDialog({
  open,
  onClose,
  action,
  selectedItems,
  state,
  onRename,
  onMove
}: BulkActionsDialogProps) {
  const [newName, setNewName] = useState('');
  const [targetId, setTargetId] = useState('');

  const handleRename = () => {
    if (!newName.trim()) {
      toast.error('Inserisci un nuovo nome');
      return;
    }

    // Only allow single item rename
    if (selectedItems.samples.length === 1) {
      onRename('sample', selectedItems.samples[0], newName);
    } else if (selectedItems.boxes.length === 1) {
      onRename('box', selectedItems.boxes[0], newName);
    } else if (selectedItems.shelves.length === 1) {
      onRename('shelf', selectedItems.shelves[0], newName);
    }

    setNewName('');
    onClose();
  };

  const handleMove = () => {
    if (!targetId) {
      toast.error('Seleziona una destinazione');
      return;
    }

    // Move samples to different boxes
    selectedItems.samples.forEach(sampleId => {
      onMove('sample', sampleId, targetId);
    });

    // Move boxes to different shelves
    selectedItems.boxes.forEach(boxId => {
      onMove('box', boxId, targetId);
    });

    setTargetId('');
    onClose();
  };

  const getAvailableTargets = () => {
    if (selectedItems.samples.length > 0) {
      // For samples, show available boxes
      return state.shelves.flatMap(shelf => 
        shelf.boxes.filter(box => 
          box.status === 'active' && 
          !selectedItems.boxes.includes(box.id)
        ).map(box => ({
          id: box.id,
          label: `${box.code} (${shelf.code})`
        }))
      );
    } else if (selectedItems.boxes.length > 0) {
      // For boxes, show available shelves
      return state.shelves.filter(shelf => 
        shelf.status === 'active' && 
        !selectedItems.shelves.includes(shelf.id)
      ).map(shelf => ({
        id: shelf.id,
        label: shelf.code
      }));
    }
    return [];
  };

  const canRename = () => {
    const totalSelected = selectedItems.shelves.length + selectedItems.boxes.length + selectedItems.samples.length;
    return totalSelected === 1;
  };

  const targets = getAvailableTargets();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === 'rename' ? 'Rinomina Elemento' : 'Sposta Elementi'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {action === 'rename' && (
            <>
              {!canRename() ? (
                <p className="text-destructive">
                  La rinominazione è possibile solo per un elemento alla volta
                </p>
              ) : (
                <>
                  <div>
                    <Label htmlFor="newName">Nuovo Nome</Label>
                    <Input
                      id="newName"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Inserisci il nuovo nome"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleRename} className="flex-1">
                      Rinomina
                    </Button>
                    <Button onClick={onClose} variant="outline">
                      Annulla
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {action === 'move' && (
            <>
              {targets.length === 0 ? (
                <p className="text-muted-foreground">
                  Nessuna destinazione disponibile per lo spostamento
                </p>
              ) : (
                <>
                  <div>
                    <Label htmlFor="target">
                      {selectedItems.samples.length > 0 ? 'Cassetta di Destinazione' : 'Scaffale di Destinazione'}
                    </Label>
                    <Select value={targetId} onValueChange={setTargetId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona destinazione" />
                      </SelectTrigger>
                      <SelectContent>
                        {targets.map(target => (
                          <SelectItem key={target.id} value={target.id}>
                            {target.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleMove} className="flex-1">
                      Sposta
                    </Button>
                    <Button onClick={onClose} variant="outline">
                      Annulla
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}