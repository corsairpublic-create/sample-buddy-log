import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppState } from '@/types/sample';
import { Settings as SettingsIcon, Key, Printer, Save, Check, X, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';

interface SettingsSectionProps {
  settings: AppState['settings'];
  onSettingsChange: (settings: AppState['settings']) => void;
  addLog: (action: string, details: string, itemType: 'shelf' | 'box' | 'sample', itemCode: string) => void;
  logs: any[];
  allData: AppState;
}

export function SettingsSection({ settings, onSettingsChange, addLog, logs, allData }: SettingsSectionProps) {
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

  const exportDataToPDF = async () => {
    try {
      const formatTimestamp = (timestamp: Date) => {
        return new Intl.DateTimeFormat('it-IT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).format(new Date(timestamp));
      };

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Sample Buddy - Esportazione Dati Completa</title>
            <style>
              body {
                font-family: 'Arial', sans-serif;
                font-size: 11px;
                line-height: 1.4;
                margin: 20px;
                color: #333;
              }
              h1 {
                text-align: center;
                color: #2563eb;
                border-bottom: 2px solid #2563eb;
                padding-bottom: 10px;
                margin-bottom: 20px;
              }
              h2 {
                color: #1e40af;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 5px;
                margin-top: 25px;
              }
              .meta {
                text-align: center;
                margin-bottom: 30px;
                padding: 10px;
                background-color: #f3f4f6;
                border-radius: 5px;
              }
              .section {
                margin-bottom: 30px;
                page-break-inside: avoid;
              }
              .log-entry {
                margin-bottom: 8px;
                padding: 8px;
                border-left: 3px solid #e5e7eb;
                background-color: #f9fafb;
              }
              .log-timestamp {
                font-weight: bold;
                color: #374151;
              }
              .log-action {
                color: #2563eb;
                font-weight: bold;
              }
              .data-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
              }
              .data-table th,
              .data-table td {
                border: 1px solid #d1d5db;
                padding: 8px;
                text-align: left;
              }
              .data-table th {
                background-color: #f3f4f6;
                font-weight: bold;
              }
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
              }
              .stat-card {
                padding: 15px;
                border: 1px solid #d1d5db;
                border-radius: 5px;
                background-color: #f9fafb;
              }
              .stat-number {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
              }
              .stat-label {
                color: #6b7280;
                margin-top: 5px;
              }
              @media print {
                body { margin: 10px; }
                .section { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <h1>SAMPLE BUDDY - ESPORTAZIONE DATI COMPLETA</h1>
            <div class="meta">
              <strong>Data generazione:</strong> ${new Date().toLocaleString('it-IT')}<br>
              <strong>Sistema versione:</strong> v1.0.0<br>
              <strong>Sviluppato da:</strong> Buzle Francesco Tudor
            </div>

            <div class="section">
              <h2>📊 Statistiche Generali</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${allData.shelves.length}</div>
                  <div class="stat-label">Scaffali Totali</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${allData.shelves.reduce((sum, shelf) => sum + shelf.boxes.length, 0)}</div>
                  <div class="stat-label">Cassette Totali</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${allData.shelves.reduce((sum, shelf) => sum + shelf.boxes.reduce((boxSum, box) => boxSum + box.samples.length, 0), 0)}</div>
                  <div class="stat-label">Campioni Totali</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${logs.length}</div>
                  <div class="stat-label">Azioni Registrate</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>📚 Scaffali</h2>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Codice</th>
                    <th>Nome</th>
                    <th>Cassette</th>
                    <th>Data Creazione</th>
                  </tr>
                </thead>
                <tbody>
                  ${allData.shelves.map(shelf => `
                    <tr>
                      <td>${shelf.code}</td>
                      <td>${shelf.code}</td>
                      <td>${shelf.boxes.length}</td>
                      <td>${formatTimestamp(shelf.createdAt)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>📦 Cassette</h2>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Codice</th>
                    <th>Nome</th>
                    <th>Scaffale</th>
                    <th>Campioni</th>
                    <th>Data Creazione</th>
                  </tr>
                </thead>
                <tbody>
                  ${allData.shelves.flatMap(shelf => 
                    shelf.boxes.map(box => `
                      <tr>
                        <td>${box.code}</td>
                        <td>${box.code}</td>
                        <td>${shelf.code}</td>
                        <td>${box.samples.length}</td>
                        <td>${formatTimestamp(box.createdAt)}</td>
                      </tr>
                    `)
                  ).join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>🧪 Campioni</h2>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Codice</th>
                    <th>Nome</th>
                    <th>Cassetta</th>
                    <th>Scaffale</th>
                    <th>Status</th>
                    <th>Data Creazione</th>
                  </tr>
                </thead>
                <tbody>
                  ${allData.shelves.flatMap(shelf => 
                    shelf.boxes.flatMap(box => 
                      box.samples.map(sample => `
                        <tr>
                          <td>${sample.code}</td>
                          <td>${sample.code}</td>
                          <td>${box.code}</td>
                          <td>${shelf.code}</td>
                          <td>${sample.status}</td>
                          <td>${formatTimestamp(sample.createdAt)}</td>
                        </tr>
                      `)
                    )
                  ).join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>📋 Log delle Azioni</h2>
              ${logs.map(log => `
                <div class="log-entry">
                  <div class="log-timestamp">[${formatTimestamp(log.timestamp)}]</div>
                  <div><span class="log-action">${log.action}</span> - ${log.details}</div>
                  <div>Operatore: ${log.operator} | Tipo: ${log.itemType} | Codice: ${log.itemCode}</div>
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `;

      const opt = {
        margin: 1,
        filename: `sample-buddy-export-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(htmlContent).save();
      
      addLog('EXPORT_PDF', 'Dati esportati in PDF', 'sample', 'pdf-export');
      toast.success('Dati esportati in PDF con successo');
    } catch (error) {
      console.error('Errore durante l\'esportazione PDF:', error);
      toast.error('Errore durante l\'esportazione PDF');
    }
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

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5" />
            Esportazione Dati
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Esporta tutti i dati del sistema inclusi scaffali, cassette, campioni e log delle azioni in formato PDF stampabile.</p>
          </div>
          
          <Button onClick={exportDataToPDF} className="gap-2">
            <FileDown className="w-4 h-4" />
            Esporta Dati
          </Button>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
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