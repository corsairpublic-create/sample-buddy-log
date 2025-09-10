import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogEntry } from '@/types/sample';
import { FileText, Clock, User, Activity, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';

interface LogSectionProps {
  logs: LogEntry[];
  addLog: (action: string, details: string, itemType: 'shelf' | 'box' | 'sample', itemCode: string) => void;
}

export function LogSection({ logs, addLog }: LogSectionProps) {
  const getActionColor = (action: string) => {
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'bg-primary text-primary-foreground';
    if (action.includes('CREATO') || action.includes('ARCHIVIATO')) return 'bg-success text-success-foreground';
    if (action.includes('SMALTITO')) return 'bg-warning text-warning-foreground';
    if (action.includes('ELIMINATO')) return 'bg-destructive text-destructive-foreground';
    if (action.includes('SCANSIONATO')) return 'bg-accent text-accent-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const getItemTypeIcon = (itemType: string) => {
    switch (itemType) {
      case 'shelf': return '📚';
      case 'box': return '📦';
      case 'sample': return '🧪';
      default: return '📋';
    }
  };

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

  const exportLog = () => {
    const logText = logs.map(log => 
      `[${formatTimestamp(log.timestamp)}] ${log.operator} - ${log.action}: ${log.details} (${log.itemType}: ${log.itemCode})`
    ).join('\n');
    
    const fullLogContent = [
      `SAMPLE BUDDY - LOG DELLE AZIONI\n`,
      `=================================\n\n`,
      `Data generazione: ${new Date().toLocaleString('it-IT')}\n\n`,
      logText
    ].join('');
    
    const blob = new Blob([fullLogContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `sample-buddy-log-${Date.now()}.txt`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addLog('export', 'Log esportato', 'sample', 'log-export');
  };

  const printLog = () => {
    const logText = logs.map(log => 
      `[${formatTimestamp(log.timestamp)}] ${log.operator} - ${log.action}: ${log.details} (${log.itemType}: ${log.itemCode})`
    ).join('\n');
    
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sample Buddy - Log delle Azioni</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              margin: 20px;
              color: black;
            }
            h1 {
              text-align: center;
              border-bottom: 2px solid black;
              padding-bottom: 10px;
            }
            .meta {
              text-align: center;
              margin-bottom: 20px;
              font-style: italic;
            }
            .log-entry {
              margin-bottom: 5px;
              white-space: pre-wrap;
            }
            @media print {
              body { margin: 10px; }
            }
          </style>
        </head>
        <body>
          <h1>SAMPLE BUDDY - LOG DELLE AZIONI</h1>
          <div class="meta">Data generazione: ${new Date().toLocaleString('it-IT')}</div>
          <div class="log-content">
            ${logs.map(log => 
              `<div class="log-entry">[${formatTimestamp(log.timestamp)}] ${log.operator} - ${log.action}: ${log.details} (${log.itemType}: ${log.itemCode})</div>`
            ).join('')}
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
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHTML);
      printWindow.document.close();
    }
    
    addLog('print', 'Log stampato', 'sample', 'log-print');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Log delle Attività
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Totale azioni registrate: {logs.length}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportLog} size="sm" variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Esporta
            </Button>
            <Button onClick={printLog} size="sm" variant="outline" className="gap-2">
              <Printer className="w-4 h-4" />
              Stampa
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-3">Legenda Colori</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">Login/Logout</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-success text-success-foreground">Creazione/Archiviazione</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-warning text-warning-foreground">Smaltimento</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-destructive text-destructive-foreground">Eliminazione</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-accent text-accent-foreground">Scansione</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-muted text-muted-foreground">Altro</Badge>
            </div>
          </div>
        </div>

        {/* Log entries */}
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nessuna attività registrata
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="text-2xl">{getItemTypeIcon(log.itemType)}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {log.itemCode && `Codice: ${log.itemCode}`}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium text-foreground mb-1">
                    {log.details}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(log.timestamp)}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.operator}
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {log.itemType}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}