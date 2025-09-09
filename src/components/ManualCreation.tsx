import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shelf } from '@/types/sample';
import { Plus, Archive, Package, TestTube } from 'lucide-react';
import { toast } from 'sonner';

interface ManualCreationProps {
  onCreateShelf: (code: string) => void;
  onCreateBox: (shelfCode: string, boxCode: string) => void;
  onCreateSample: (shelfCode: string, boxCode: string, sampleCode: string) => void;
  shelves: Shelf[];
}

export function ManualCreation({ onCreateShelf, onCreateBox, onCreateSample, shelves }: ManualCreationProps) {
  const [shelfCode, setShelfCode] = useState('');
  const [boxCode, setBoxCode] = useState('');
  const [selectedShelfForBox, setSelectedShelfForBox] = useState('');
  const [sampleCode, setSampleCode] = useState('');
  const [selectedShelfForSample, setSelectedShelfForSample] = useState('');
  const [selectedBoxForSample, setSelectedBoxForSample] = useState('');

  const handleCreateShelf = () => {
    if (!shelfCode.trim()) {
      toast.error('Inserisci un codice per lo scaffale');
      return;
    }
    onCreateShelf(shelfCode.trim());
    setShelfCode('');
  };

  const handleCreateBox = () => {
    if (!boxCode.trim() || !selectedShelfForBox) {
      toast.error('Inserisci un codice per la cassetta e seleziona uno scaffale');
      return;
    }
    onCreateBox(selectedShelfForBox, boxCode.trim());
    setBoxCode('');
    setSelectedShelfForBox('');
  };

  const handleCreateSample = () => {
    if (!sampleCode.trim() || !selectedShelfForSample || !selectedBoxForSample) {
      toast.error('Compila tutti i campi per creare il campione');
      return;
    }
    onCreateSample(selectedShelfForSample, selectedBoxForSample, sampleCode.trim());
    setSampleCode('');
    setSelectedShelfForSample('');
    setSelectedBoxForSample('');
  };

  const getAvailableBoxes = () => {
    const shelf = shelves.find(s => s.code === selectedShelfForSample);
    return shelf ? shelf.boxes.filter(b => b.status === 'active') : [];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Creazione Manuale Elementi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="shelf" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="shelf" className="gap-2">
                <Archive className="w-4 h-4" />
                Scaffale
              </TabsTrigger>
              <TabsTrigger value="box" className="gap-2">
                <Package className="w-4 h-4" />
                Cassetta
              </TabsTrigger>
              <TabsTrigger value="sample" className="gap-2">
                <TestTube className="w-4 h-4" />
                Campione
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shelf" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Crea Nuovo Scaffale</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Gli scaffali devono iniziare con "Scaffale", "SC" o "AL" seguiti dai dettagli.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shelf-code">Codice Scaffale</Label>
                  <Input
                    id="shelf-code"
                    placeholder="Es. Scaffale-A001, SC-LAB-01, AL-AREA-MACINAZIONE"
                    value={shelfCode}
                    onChange={(e) => setShelfCode(e.target.value)}
                  />
                </div>
                
                <Button onClick={handleCreateShelf} className="w-full gap-2">
                  <Archive className="w-4 h-4" />
                  Crea Scaffale
                </Button>
                
                <div className="text-xs text-muted-foreground">
                  <p><strong>Convenzioni:</strong></p>
                  <p>• SC/Scaffale: Campioni TQ (tal quale)</p>
                  <p>• AL: Campioni MC (macinato)</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="box" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Crea Nuova Cassetta</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Le cassette devono iniziare con "Cassetta", "CA" o "AL" e essere associate a uno scaffale esistente.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="box-shelf-select">Scaffale di Destinazione</Label>
                  <Select value={selectedShelfForBox} onValueChange={setSelectedShelfForBox}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona scaffale" />
                    </SelectTrigger>
                    <SelectContent>
                      {shelves.filter(s => s.status === 'active').map((shelf) => (
                        <SelectItem key={shelf.id} value={shelf.code}>
                          {shelf.code} ({shelf.boxes.length} cassette)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="box-code">Codice Cassetta</Label>
                  <Input
                    id="box-code"
                    placeholder="Es. Cassetta-001, CA-LAB-A, AL-MACINAZIONE-01"
                    value={boxCode}
                    onChange={(e) => setBoxCode(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleCreateBox} 
                  className="w-full gap-2"
                  disabled={!selectedShelfForBox}
                >
                  <Package className="w-4 h-4" />
                  Crea Cassetta
                </Button>
                
                <div className="text-xs text-muted-foreground">
                  <p><strong>Convenzioni:</strong></p>
                  <p>• CA/Cassetta: Per campioni TQ (tal quale)</p>
                  <p>• AL: Per campioni MC (macinato)</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sample" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Crea Nuovo Campione</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    I campioni devono essere in formato numerico (es. 2501234-001) e verranno automaticamente etichettati come TQ o MC.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sample-shelf-select">Scaffale</Label>
                  <Select value={selectedShelfForSample} onValueChange={setSelectedShelfForSample}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona scaffale" />
                    </SelectTrigger>
                    <SelectContent>
                      {shelves.filter(s => s.status === 'active').map((shelf) => (
                        <SelectItem key={shelf.id} value={shelf.code}>
                          {shelf.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sample-box-select">Cassetta</Label>
                  <Select 
                    value={selectedBoxForSample} 
                    onValueChange={setSelectedBoxForSample}
                    disabled={!selectedShelfForSample}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona cassetta" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableBoxes().map((box) => (
                        <SelectItem key={box.id} value={box.code}>
                          {box.code} ({box.samples.length} campioni)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sample-code">Codice Campione</Label>
                  <Input
                    id="sample-code"
                    placeholder="Es. 2501234-001, 2502567-002"
                    value={sampleCode}
                    onChange={(e) => setSampleCode(e.target.value)}
                  />
                </div>
                
                {selectedShelfForSample && selectedBoxForSample && (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    <p><strong>Anteprima:</strong></p>
                    <p>Codice finale: {sampleCode} {
                      (() => {
                        const shelf = shelves.find(s => s.code === selectedShelfForSample);
                        const box = shelf?.boxes.find(b => b.code === selectedBoxForSample);
                        if (shelf && box) {
                          const shelfIsAL = shelf.code.toUpperCase().startsWith('AL');
                          const boxIsAL = box.code.toUpperCase().startsWith('AL');
                          return (shelfIsAL && boxIsAL) ? 'MC' : 'TQ';
                        }
                        return 'TQ';
                      })()
                    }</p>
                    <p>Posizione: Scaffale {selectedShelfForSample} → Cassetta {selectedBoxForSample}</p>
                  </div>
                )}
                
                <Button 
                  onClick={handleCreateSample} 
                  className="w-full gap-2"
                  disabled={!selectedShelfForSample || !selectedBoxForSample}
                >
                  <TestTube className="w-4 h-4" />
                  Crea Campione
                </Button>
                
                <div className="text-xs text-muted-foreground">
                  <p><strong>Tipologie automatiche:</strong></p>
                  <p>• TQ (tal quale): Scaffali SC/Cassette CA</p>
                  <p>• MC (macinato): Scaffali AL + Cassette AL</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Stato Attuale Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">{shelves.length}</div>
              <div className="text-muted-foreground">Scaffali</div>
            </div>
            <div className="text-center p-4 bg-accent/5 rounded-lg">
              <div className="text-2xl font-bold text-accent">
                {shelves.reduce((acc, shelf) => acc + shelf.boxes.length, 0)}
              </div>
              <div className="text-muted-foreground">Cassette</div>
            </div>
            <div className="text-center p-4 bg-success/5 rounded-lg">
              <div className="text-2xl font-bold text-success">
                {shelves.reduce((acc, shelf) => 
                  acc + shelf.boxes.reduce((acc2, box) => acc2 + box.samples.length, 0), 0
                )}
              </div>
              <div className="text-muted-foreground">Campioni</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}