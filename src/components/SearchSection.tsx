import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppState, Sample, Box, Shelf } from '@/types/sample';
import { Search, MapPin, Trash2, Archive, Edit, FileText, Move } from 'lucide-react';
import { toast } from 'sonner';

interface SearchSectionProps {
  state: AppState;
  onStateChange: (updater: (prev: AppState) => AppState) => void;
  addLog: (action: string, details: string, itemType: 'shelf' | 'box' | 'sample', itemCode: string) => void;
}

export function SearchSection({ state, onStateChange, addLog }: SearchSectionProps) {
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
    onStateChange(prev => {
      const newState = { ...prev };
      
      // Delete samples
      selectedItems.samples.forEach(sampleId => {
        const sample = findSampleById(newState, sampleId);
        if (sample) {
          sample.sample.status = 'deleted';
          sample.sample.deletedAt = new Date();
          addLog('CAMPIONE_ELIMINATO', 
            `Campione eliminato: ${sample.sample.code} da cassetta ${sample.box.code} di scaffale ${sample.shelf.code}`,
            'sample', 
            sample.sample.code
          );
        }
      });

      // Delete boxes
      selectedItems.boxes.forEach(boxId => {
        const result = findBoxById(newState, boxId);
        if (result) {
          result.box.status = 'deleted';
          result.box.samples.forEach(sample => {
            sample.status = 'deleted';
            sample.deletedAt = new Date();
          });
          addLog('CASSETTA_ELIMINATA', 
            `Cassetta eliminata: ${result.box.code} da scaffale ${result.shelf.code}`,
            'box', 
            result.box.code
          );
        }
      });

      return newState;
    });

    setSelectedItems({ shelves: [], boxes: [], samples: [] });
    toast.success('Elementi eliminati con successo');
  };

  const disposeItems = () => {
    onStateChange(prev => {
      const newState = { ...prev };
      
      // Dispose samples
      selectedItems.samples.forEach(sampleId => {
        const sample = findSampleById(newState, sampleId);
        if (sample) {
          sample.sample.status = 'disposed';
          sample.sample.disposedAt = new Date();
          addLog('CAMPIONE_SMALTITO', 
            `Campione smaltito: ${sample.sample.code} da cassetta ${sample.box.code} di scaffale ${sample.shelf.code}`,
            'sample', 
            sample.sample.code
          );
        }
      });

      return newState;
    });

    setSelectedItems({ shelves: [], boxes: [], samples: [] });
    toast.success('Elementi smaltiti con successo');
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
    </div>
  );
}