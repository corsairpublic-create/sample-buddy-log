import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppState } from '@/types/sample';
import { Settings, Key, Printer, Save, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsSectionProps {
  settings: AppState['settings'];
  onSettingsChange: (settings: AppState['settings']) => void;
  addLog: (action: string, details: string, itemType: 'shelf' | 'box' | 'sample', itemCode: string) => void;
}

export function SettingsSection({ settings, onSettingsChange, addLog }: SettingsSectionProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  const [printerWidth, setPrinterWidth] = useState(settings.printerSettings.defaultWidth);
  const [printerHeight, setPrinterHeight] = useState(settings.printerSettings.defaultHeight);
  const [selectedPrinter, setSelectedPrinter] = useState(settings.printerSettings.selectedPrinter);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Le nuove password non corrispondono');
      return;
    }

    if (newPassword.length < 3) {
      toast.error('La nuova password deve essere di almeno 3 caratteri');
      return;
    }

    // Use Electron API if available for password management
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.changePassword(oldPassword, newPassword);
        if (result.success) {
          toast.success('Password cambiata con successo');
          addLog('PASSWORD_CHANGED', 'Password di eliminazione modificata (Electron)', 'sample', '');
        } else {
          toast.error(result.error || 'Errore nel cambio password');
          return;
        }
      } catch (error) {
        toast.error('Errore durante il cambio password');
        return;
      }
    } else {
      // Fallback for web version
      if (oldPassword !== settings.deletePassword) {
        toast.error('Password attuale non corretta');
        return;
      }

      onSettingsChange({
        ...settings,
        deletePassword: newPassword
      });

      toast.success('Password cambiata con successo');
      addLog('PASSWORD_CHANGED', 'Password di eliminazione modificata', 'sample', '');
    }
    
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordDialog(false);
  };

  const handlePrinterSettingsChange = () => {
    onSettingsChange({
      ...settings,
      printerSettings: {
        defaultWidth: printerWidth,
        defaultHeight: printerHeight,
        selectedPrinter: selectedPrinter
      }
    });

    addLog('IMPOSTAZIONI_STAMPANTE', `Impostazioni stampante aggiornate: ${printerWidth}x${printerHeight}cm, stampante: ${selectedPrinter}`, 'sample', '');
    toast.success('Impostazioni stampante salvate');
  };

  return (
    <div className="space-y-6">
      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Gestione Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>La password corrente per l'eliminazione dei campioni è impostata.</p>
            <p>È richiesta per tutte le operazioni di eliminazione definitiva.</p>
          </div>
          
          <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Key className="w-4 h-4" />
                Cambia Password
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifica Password di Eliminazione</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="old-password">Password Precedente</Label>
                  <Input
                    id="old-password"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Inserisci la password attuale"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nuova Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Inserisci la nuova password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Conferma Nuova Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Conferma la nuova password"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handlePasswordChange} 
                    className="flex-1 gap-2"
                    disabled={!oldPassword || !newPassword || !confirmPassword}
                  >
                    <Check className="w-4 h-4" />
                    Conferma
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowPasswordDialog(false);
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }} 
                    variant="outline"
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Annulla
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Printer Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Impostazioni Stampante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-width">Larghezza Predefinita (cm)</Label>
              <Input
                id="default-width"
                type="number"
                min="1"
                max="50"
                value={printerWidth}
                onChange={(e) => setPrinterWidth(Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="default-height">Altezza Predefinita (cm)</Label>
              <Input
                id="default-height"
                type="number"
                min="1"
                max="50"
                value={printerHeight}
                onChange={(e) => setPrinterHeight(Number(e.target.value))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="selected-printer">Stampante Predefinita</Label>
            <Input
              id="selected-printer"
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              placeholder="Nome della stampante (es. HP LaserJet Pro)"
            />
          </div>
          
          <Button onClick={handlePrinterSettingsChange} className="gap-2">
            <Save className="w-4 h-4" />
            Salva Impostazioni Stampante
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <p>• Le dimensioni predefinite verranno utilizzate per la stampa dei codici a barre</p>
            <p>• La stampante selezionata sarà quella predefinita per tutte le stampe</p>
            <p>• Le stampanti di rete devono essere configurate nel sistema Windows</p>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Informazioni Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Versione Sistema:</p>
              <p className="text-muted-foreground">v1.0.0</p>
            </div>
            <div>
              <p className="font-medium">Sviluppato da:</p>
              <p className="text-muted-foreground">Buzle Francesco Tudor</p>
            </div>
            <div>
              <p className="font-medium">Password Eliminazione:</p>
              <p className="text-muted-foreground">••••••••••</p>
            </div>
            <div>
              <p className="font-medium">Stampante Attuale:</p>
              <p className="text-muted-foreground">{selectedPrinter || 'Non configurata'}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Sistema di gestione campioni - Tutte le azioni vengono registrate nel log delle attività.
              Per informazioni o domande contattare francescobuzle@icloud.com
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Programma sviluppato da Buzle Francesco Tudor
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}