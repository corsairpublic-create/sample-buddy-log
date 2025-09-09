import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarcodeScanner } from './BarcodeScanner';
import { SearchSection } from './SearchSection';
import { LogSection } from './LogSection';
import { PrintSection } from './PrintSection';
import { SettingsSection } from './SettingsSection';
import { ManualCreation } from './ManualCreation';
import { GuideSection } from './GuideSection';
import { ArchivingStatus } from './ArchivingStatus';
import { useSampleManager } from '@/hooks/useSampleManager';
import { LogOut, Archive, Search, Printer, Settings, Plus, HelpCircle, FileText } from 'lucide-react';

interface MainInterfaceProps {
  onLogout: () => void;
  operator: string;
}

export function MainInterface({ onLogout, operator }: MainInterfaceProps) {
  const { state, scanCode, createShelf, createBox, createSample, addLog, setState } = useSampleManager();
  const [archivingState, setArchivingState] = useState<{
    currentShelf?: string;
    currentBox?: string;
    step: 'shelf' | 'box' | 'sample';
  }>({
    step: 'shelf'
  });

  const handleScan = (code: string) => {
    const itemType = determineItemType(code);
    
    if (itemType === 'shelf') {
      setArchivingState({
        currentShelf: code,
        step: 'box'
      });
    } else if (itemType === 'box' && archivingState.currentShelf) {
      setArchivingState({
        ...archivingState,
        currentBox: code,
        step: 'sample'
      });
    } else if (itemType === 'sample' && archivingState.currentShelf && archivingState.currentBox) {
      // Reset to start after successful sample archiving
      setArchivingState({ step: 'shelf' });
    }
    
    scanCode(code, archivingState.currentShelf, archivingState.currentBox);
  };

  const determineItemType = (code: string): 'shelf' | 'box' | 'sample' => {
    const upperCode = code.toUpperCase();
    if (upperCode.startsWith('SCAFFALE') || upperCode.startsWith('SC') || upperCode.startsWith('AL')) {
      return 'shelf';
    }
    if (upperCode.startsWith('CASSETTA') || upperCode.startsWith('CA')) {
      return 'box';
    }
    return 'sample';
  };

  const resetArchiving = () => {
    setArchivingState({ step: 'shelf' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Sistema Gestione Campioni</h1>
            <p className="text-sm text-muted-foreground">
              Operatore: <span className="font-medium text-foreground">{operator}</span>
            </p>
          </div>
          <Button onClick={onLogout} variant="outline" className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6">
          {/* Barcode Scanner - Always visible */}
          <BarcodeScanner 
            onScan={handleScan}
            placeholder="Scansiona scaffale, cassetta o campione..."
          />

          {/* Archiving Status */}
          <ArchivingStatus 
            archivingState={archivingState}
            onReset={resetArchiving}
          />

          {/* Main Tabs */}
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="search" className="gap-2">
                <Search className="w-4 h-4" />
                Cerca
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-2">
                <FileText className="w-4 h-4" />
                Log
              </TabsTrigger>
              <TabsTrigger value="print" className="gap-2">
                <Printer className="w-4 h-4" />
                Stampa
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2">
                <Plus className="w-4 h-4" />
                Creazione
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" />
                Impostazioni
              </TabsTrigger>
              <TabsTrigger value="guide" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                Guida
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="mt-6">
              <SearchSection 
                state={state} 
                onStateChange={setState}
                addLog={addLog}
              />
            </TabsContent>

            <TabsContent value="logs" className="mt-6">
              <LogSection logs={state.logs} />
            </TabsContent>

            <TabsContent value="print" className="mt-6">
              <PrintSection 
                state={state}
                printerSettings={state.settings.printerSettings}
              />
            </TabsContent>

            <TabsContent value="manual" className="mt-6">
              <ManualCreation 
                onCreateShelf={createShelf}
                onCreateBox={createBox}
                onCreateSample={createSample}
                shelves={state.shelves}
              />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <SettingsSection 
                settings={state.settings}
                onSettingsChange={(newSettings) => 
                  setState(prev => ({ ...prev, settings: newSettings }))
                }
                addLog={addLog}
              />
            </TabsContent>

            <TabsContent value="guide" className="mt-6">
              <GuideSection />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}