import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppState } from '@/types/sample';
import { Printer, QrCode, FileText, Download } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { toast } from 'sonner';

interface PrintSectionProps {
  state: AppState;
  printerSettings: {
    defaultWidth: number;
    defaultHeight: number;
    selectedPrinter: string;
  };
}

export function PrintSection({ state, printerSettings }: PrintSectionProps) {
  const [barcodeText, setBarcodeText] = useState('');
  const [width, setWidth] = useState(printerSettings.defaultWidth);
  const [height, setHeight] = useState(printerSettings.defaultHeight);
  const [selectedPrinter, setSelectedPrinter] = useState(printerSettings.selectedPrinter);
  const [availablePrinters, setAvailablePrinters] = useState<any[]>([]);

  // Load available printers from Electron
  useEffect(() => {
    const loadPrinters = async () => {
      if (window.electronAPI) {
        try {
          const printers = await window.electronAPI.getPrinters();
          setAvailablePrinters(printers);
          if (printers.length > 0 && !selectedPrinter) {
            const defaultPrinter = printers.find(p => p.isDefault) || printers[0];
            setSelectedPrinter(defaultPrinter.name);
          }
        } catch (error) {
          console.error('Failed to load printers:', error);
        }
      }
    };

    loadPrinters();
  }, [selectedPrinter]);

  const generateBarcode = (text: string) => {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, text, {
        format: "CODE128",
        width: 2,
        height: 100,
        displayValue: true,
        margin: 10
      });
      return canvas.toDataURL();
    } catch (error) {
      toast.error('Errore nella generazione del codice a barre');
      return null;
    }
  };

  const printBarcode = async () => {
    if (!barcodeText.trim()) {
      toast.error('Inserisci un testo per il codice a barre');
      return;
    }

    const barcodeDataUrl = generateBarcode(barcodeText);
    if (!barcodeDataUrl) return;

    // Try native printing with Electron first
    if (window.electronAPI && selectedPrinter) {
      try {
        const printHTML = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Stampa Codice a Barre</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  font-family: Arial, sans-serif;
                }
                .barcode-container {
                  text-align: center;
                  border: 1px solid #ddd;
                  padding: 20px;
                  background: white;
                }
                img {
                  max-width: 100%;
                  height: auto;
                }
                .info {
                  margin-top: 10px;
                  font-size: 12px;
                  color: #666;
                }
                @media print {
                  body { margin: 0; padding: 0; }
                  .barcode-container { border: none; }
                }
              </style>
            </head>
            <body>
              <div class="barcode-container">
                <img src="${barcodeDataUrl}" alt="Codice a barre: ${barcodeText}" />
                <div class="info">
                  Dimensioni: ${width}cm x ${height}cm<br>
                  Generato il: ${new Date().toLocaleString('it-IT')}
                </div>
              </div>
            </body>
          </html>
        `;

        const result = await window.electronAPI.print({
          html: printHTML,
          printerName: selectedPrinter,
          silent: true
        });

        if (result.success) {
          toast.success('Codice a barre stampato con successo');
          return;
        } else {
          throw new Error(result.error || 'Errore durante la stampa');
        }
      } catch (error) {
        console.error('Native print failed, falling back to browser print:', error);
        toast.error(`Errore stampa nativa: ${error}. Uso stampa browser.`);
      }
    }

    // Fallback to browser printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Impossibile aprire la finestra di stampa');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stampa Codice a Barre</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            .barcode-container {
              text-align: center;
              border: 1px solid #ddd;
              padding: 20px;
              background: white;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            .info {
              margin-top: 10px;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .barcode-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <img src="${barcodeDataUrl}" alt="Codice a barre: ${barcodeText}" />
            <div class="info">
              Dimensioni: ${width}cm x ${height}cm<br>
              Generato il: ${new Date().toLocaleString('it-IT')}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    toast.success('Codice a barre inviato in stampa (browser)');
  };

  const downloadBarcode = () => {
    if (!barcodeText.trim()) {
      toast.error('Inserisci un testo per il codice a barre');
      return;
    }

    const barcodeDataUrl = generateBarcode(barcodeText);
    if (!barcodeDataUrl) return;

    const link = document.createElement('a');
    link.download = `barcode_${barcodeText}_${Date.now()}.png`;
    link.href = barcodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Codice a barre scaricato');
  };

  const generateReport = () => {
    const reportContent = `
      REPORT SISTEMA GESTIONE CAMPIONI
      ================================
      
      Data generazione: ${new Date().toLocaleString('it-IT')}
      
      RIEPILOGO SCAFFALI:
      -------------------
      ${state.shelves.map(shelf => `
      Scaffale: ${shelf.code} (${shelf.status})
      - Cassette: ${shelf.boxes.length}
      - Campioni totali: ${shelf.boxes.reduce((acc, box) => acc + box.samples.length, 0)}
      
      Cassette:
      ${shelf.boxes.map(box => `
        → ${box.code} (${box.status})
          Campioni: ${box.samples.length}
          ${box.samples.map(sample => `    • ${sample.code} (${sample.status})`).join('\n')}
      `).join('')}
      `).join('')}
      
      STATISTICHE:
      ------------
      - Scaffali totali: ${state.shelves.length}
      - Cassette totali: ${state.shelves.reduce((acc, shelf) => acc + shelf.boxes.length, 0)}
      - Campioni totali: ${state.shelves.reduce((acc, shelf) => acc + shelf.boxes.reduce((acc2, box) => acc2 + box.samples.length, 0), 0)}
      - Campioni attivi: ${state.shelves.reduce((acc, shelf) => acc + shelf.boxes.reduce((acc2, box) => acc2 + box.samples.filter(s => s.status === 'active').length, 0), 0)}
      - Campioni smaltiti: ${state.shelves.reduce((acc, shelf) => acc + shelf.boxes.reduce((acc2, box) => acc2 + box.samples.filter(s => s.status === 'disposed').length, 0), 0)}
      - Campioni eliminati: ${state.shelves.reduce((acc, shelf) => acc + shelf.boxes.reduce((acc2, box) => acc2 + box.samples.filter(s => s.status === 'deleted').length, 0), 0)}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `report_campioni_${Date.now()}.txt`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Report generato e scaricato');
  };

  return (
    <div className="space-y-6">
      {/* Barcode Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Generazione Codici a Barre
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode-text">Testo del Codice a Barre</Label>
              <Input
                id="barcode-text"
                placeholder="Es. 2501234-001"
                value={barcodeText}
                onChange={(e) => setBarcodeText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="printer-select">Stampante</Label>
              <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona stampante" />
                </SelectTrigger>
                <SelectContent>
                  {availablePrinters.length > 0 ? (
                    availablePrinters.map((printer) => (
                      <SelectItem key={printer.name} value={printer.name}>
                        {printer.displayName || printer.name} {printer.isDefault ? '(Predefinita)' : ''}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="default">Stampante predefinita</SelectItem>
                      <SelectItem value="pdf">Salva come PDF</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Larghezza (cm)</Label>
              <Input
                id="width"
                type="number"
                min="1"
                max="50"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Altezza (cm)</Label>
              <Input
                id="height"
                type="number"
                min="1"
                max="50"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Preview */}
          {barcodeText && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-medium mb-2">Anteprima:</h4>
              <div className="text-center">
                <img 
                  src={generateBarcode(barcodeText) || ''} 
                  alt="Barcode preview" 
                  className="mx-auto max-w-full"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={printBarcode} className="gap-2">
              <Printer className="w-4 h-4" />
              Stampa
            </Button>
            <Button onClick={downloadBarcode} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Scarica
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Report e Stampe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={generateReport} variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              Genera Report Completo
            </Button>
            <Button onClick={() => window.print()} variant="outline" className="gap-2">
              <Printer className="w-4 h-4" />
              Stampa Pagina Corrente
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>• Il report completo include tutti i campioni, cassette e scaffali</p>
            <p>• I report mostrano chiaramente lo stato di ogni elemento (attivo, smaltito, eliminato)</p>
            <p>• È possibile stampare anche singole sezioni selezionando gli elementi desiderati</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}