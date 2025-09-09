import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppState, Sample, Box, Shelf } from '@/types/sample';
import { Search, MapPin, Trash2, Archive, Edit, FileText, Move, Printer } from 'lucide-react';
import { BulkActionsDialog } from '@/components/BulkActionsDialog';
import { toast } from 'sonner';

interface SearchSectionProps {
  state: AppState;
  onStateChange: (updater: (prev: AppState) => AppState) => void;
  addLog: (action: string, details: string, itemType: 'shelf' | 'box' | 'sample', itemCode: string) => void;
  onRename: (type: 'shelf' | 'box' | 'sample', id: string, newCode: string) => void;
  onMove: (type: 'box' | 'sample', id: string, targetId: string) => void;
  onBulkDispose: (selectedItems: { shelves: string[], boxes: string[], samples: string[] }) => void;
  onBulkDelete: (selectedItems: { shelves: string[], boxes: string[], samples: string[] }) => void;
}

export function SearchSection({ 
  state, 
  onStateChange, 
  addLog,
  onRename,
  onMove,
  onBulkDispose,
  onBulkDelete
}: SearchSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<{
    shelves: string[];
    boxes: string[];
    samples: string[];
  }>({
    shelves: [],
    boxes: [],
    samples: []
  });

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<'rename' | 'move' | null>(null);

  // Search logic
  const searchResults = {
    shelves: state.shelves.filter(shelf => 
      shelf.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shelf.boxes.some(box => 
        box.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        box.samples.some(sample => 
          sample.code.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    ),
    samples: [] as Array<Sample & { shelfCode: string; boxCode: string; }>
  };

  // Flatten samples for search
  state.shelves.forEach(shelf => {
    shelf.boxes.forEach(box => {
      box.samples.forEach(sample => {
        if (sample.code.toLowerCase().includes(searchTerm.toLowerCase())) {
          searchResults.samples.push({
            ...sample,
            shelfCode: shelf.code,
            boxCode: box.code
          });
        }
      });
    });
  });

  const handlePasswordSubmit = () => {
    if (password === state.settings.deletePassword) {
      pendingAction();
      setShowPasswordDialog(false);
      setPassword('');
    } else {
      toast.error('Password non corretta');
    }
  };

  const deleteItems = () => {
    onBulkDelete(selectedItems);
    setSelectedItems({ shelves: [], boxes: [], samples: [] });
  };

  const disposeItems = () => {
    onBulkDispose(selectedItems);
    setSelectedItems({ shelves: [], boxes: [], samples: [] });
  };

  const generateReport = () => {
    let reportContent = 'REPORT CAMPIONI\n';
    reportContent += '================\n\n';
    reportContent += `Generato il: ${new Date().toLocaleString('it-IT')}\n\n`;

    // Report for selected shelves
    selectedItems.shelves.forEach(shelfId => {
      const shelf = state.shelves.find(s => s.id === shelfId);
      if (shelf) {
        reportContent += `SCAFFALE: ${shelf.code}\n`;
        reportContent += `Stato: ${shelf.status}\n`;
        reportContent += `Cassette: ${shelf.boxes.length}\n`;
        reportContent += `Campioni totali: ${shelf.boxes.reduce((acc, box) => acc + box.samples.length, 0)}\n\n`;
        
        shelf.boxes.forEach(box => {
          reportContent += `  CASSETTA: ${box.code}\n`;
          reportContent += `  Stato: ${box.status}\n`;
          reportContent += `  Campioni: ${box.samples.length}\n`;
          box.samples.forEach(sample => {
            reportContent += `    - ${sample.code} (${sample.type}) - ${sample.status}\n`;
          });
          reportContent += '\n';
        });
      }
    });

    // Report for selected boxes
    selectedItems.boxes.forEach(boxId => {
      const shelf = state.shelves.find(s => s.boxes.some(b => b.id === boxId));
      const box = shelf?.boxes.find(b => b.id === boxId);
      if (box && shelf) {
        reportContent += `CASSETTA: ${box.code}\n`;
        reportContent += `Scaffale: ${shelf.code}\n`;
        reportContent += `Stato: ${box.status}\n`;
        reportContent += `Campioni: ${box.samples.length}\n`;
        box.samples.forEach(sample => {
          reportContent += `  - ${sample.code} (${sample.type}) - ${sample.status}\n`;
        });
        reportContent += '\n';
      }
    });

    // Report for selected samples
    selectedItems.samples.forEach(sampleId => {
      const sampleInfo = findSampleById(state, sampleId);
      if (sampleInfo) {
        reportContent += `CAMPIONE: ${sampleInfo.sample.code}\n`;
        reportContent += `Tipo: ${sampleInfo.sample.type}\n`;
        reportContent += `Stato: ${sampleInfo.sample.status}\n`;
        reportContent += `Scaffale: ${sampleInfo.shelf.code}\n`;
        reportContent += `Cassetta: ${sampleInfo.box.code}\n`;
        reportContent += `Creato: ${sampleInfo.sample.createdAt.toLocaleString('it-IT')}\n`;
        if (sampleInfo.sample.disposedAt) {
          reportContent += `Smaltito: ${sampleInfo.sample.disposedAt.toLocaleString('it-IT')}\n`;
        }
        if (sampleInfo.sample.deletedAt) {
          reportContent += `Eliminato: ${sampleInfo.sample.deletedAt.toLocaleString('it-IT')}\n`;
        }
        reportContent += '\n';
      }
    });

    // Create and download report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_campioni_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    addLog('REPORT_GENERATO', `Report generato per ${selectedItems.shelves.length + selectedItems.boxes.length + selectedItems.samples.length} elementi`, 'sample', '');
    toast.success('Report generato e scaricato');
  };

  const findSampleById = (state: AppState, sampleId: string) => {
    for (const shelf of state.shelves) {
      for (const box of shelf.boxes) {
        const sample = box.samples.find(s => s.id === sampleId);
        if (sample) {
          return { shelf, box, sample };
        }
      }
    }
    return null;
  };

  const findBoxById = (state: AppState, boxId: string) => {
    for (const shelf of state.shelves) {
      const box = shelf.boxes.find(b => b.id === boxId);
      if (box) {
        return { shelf, box };
      }
    }
    return null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Attivo</Badge>;
      case 'disposed':
        return <Badge className="bg-disposed text-white">Smaltito</Badge>;
      case 'deleted':
        return <Badge className="bg-deleted text-white">Eliminato</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Ricerca Campioni, Cassette e Scaffali
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Inserisci codice campione, cassetta o scaffale..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => setSearchTerm('')} variant="outline">
              Pulisci
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {(selectedItems.shelves.length > 0 || selectedItems.boxes.length > 0 || selectedItems.samples.length > 0) && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={disposeItems}
                variant="outline" 
                className="gap-2"
              >
                <Archive className="w-4 h-4" />
                Smaltisci Selezionati
              </Button>
              <Button 
                onClick={() => {
                  setPendingAction(() => deleteItems);
                  setShowPasswordDialog(true);
                }}
                variant="destructive" 
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Elimina Selezionati
              </Button>
              <Button 
                onClick={() => {
                  setBulkAction('rename');
                  setShowBulkDialog(true);
                }}
                variant="outline" 
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Rinomina
              </Button>
              <Button 
                onClick={() => {
                  setBulkAction('move');
                  setShowBulkDialog(true);
                }}
                variant="outline" 
                className="gap-2"
              >
                <Move className="w-4 h-4" />
                Sposta
              </Button>
              <Button 
                onClick={generateReport}
                variant="outline" 
                className="gap-2"
              >
                <Printer className="w-4 h-4" />
                Stampa Report
              </Button>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Selezionati: {selectedItems.shelves.length} scaffali, {selectedItems.boxes.length} cassette, {selectedItems.samples.length} campioni
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchTerm && (
        <div className="space-y-4">
          {/* Samples Results */}
          {searchResults.samples.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Campioni Trovati ({searchResults.samples.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {searchResults.samples.map((sample) => (
                    <div key={sample.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedItems.samples.includes(sample.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedItems(prev => ({
                                ...prev,
                                samples: [...prev.samples, sample.id]
                              }));
                            } else {
                              setSelectedItems(prev => ({
                                ...prev,
                                samples: prev.samples.filter(id => id !== sample.id)
                              }));
                            }
                          }}
                        />
                        <div>
                          <p className="font-medium">{sample.code}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            Scaffale: {sample.shelfCode} → Cassetta: {sample.boxCode}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(sample.status)}
                        <Badge variant={sample.type === 'TQ' ? 'default' : 'secondary'}>
                          {sample.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shelves Results */}
          {searchResults.shelves.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Scaffali Trovati ({searchResults.shelves.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {searchResults.shelves.map((shelf) => (
                    <div key={shelf.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedItems.shelves.includes(shelf.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedItems(prev => ({
                                  ...prev,
                                  shelves: [...prev.shelves, shelf.id]
                                }));
                              } else {
                                setSelectedItems(prev => ({
                                  ...prev,
                                  shelves: prev.shelves.filter(id => id !== shelf.id)
                                }));
                              }
                            }}
                          />
                          <div>
                            <p className="font-medium">{shelf.code}</p>
                            <p className="text-sm text-muted-foreground">
                              {shelf.boxes.length} cassette, {shelf.boxes.reduce((acc, box) => acc + box.samples.length, 0)} campioni
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(shelf.status)}
                      </div>
                      
                      {/* Boxes in shelf */}
                      {shelf.boxes.map((box) => (
                        <div key={box.id} className="ml-6 mt-2 p-2 bg-muted/50 rounded">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedItems.boxes.includes(box.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedItems(prev => ({
                                      ...prev,
                                      boxes: [...prev.boxes, box.id]
                                    }));
                                  } else {
                                    setSelectedItems(prev => ({
                                      ...prev,
                                      boxes: prev.boxes.filter(id => id !== box.id)
                                    }));
                                  }
                                }}
                              />
                              <span className="font-medium">{box.code}</span>
                              <span className="text-sm text-muted-foreground">
                                ({box.samples.length} campioni)
                              </span>
                            </div>
                            {getStatusBadge(box.status)}
                          </div>
                          
                          {/* Samples in box */}
                          {box.samples.map((sample) => (
                            <div key={sample.id} className="ml-6 mt-1 flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={selectedItems.samples.includes(sample.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedItems(prev => ({
                                        ...prev,
                                        samples: [...prev.samples, sample.id]
                                      }));
                                    } else {
                                      setSelectedItems(prev => ({
                                        ...prev,
                                        samples: prev.samples.filter(id => id !== sample.id)
                                      }));
                                    }
                                  }}
                                />
                                <span>{sample.code}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {getStatusBadge(sample.status)}
                                <Badge variant={sample.type === 'TQ' ? 'default' : 'secondary'} className="text-xs">
                                  {sample.type}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {searchResults.shelves.length === 0 && searchResults.samples.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nessun risultato trovato per "{searchTerm}"
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Inserisci la password per confermare l'eliminazione degli elementi selezionati.</p>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            <div className="flex gap-2">
              <Button onClick={handlePasswordSubmit} className="flex-1">
                Conferma Eliminazione
              </Button>
              <Button 
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPassword('');
                }} 
                variant="outline"
              >
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <BulkActionsDialog
        open={showBulkDialog}
        onClose={() => {
          setShowBulkDialog(false);
          setBulkAction(null);
        }}
        action={bulkAction}
        selectedItems={selectedItems}
        state={state}
        onRename={onRename}
        onMove={onMove}
      />
    </div>
  );
}