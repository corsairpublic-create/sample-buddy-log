import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogEntry } from '@/types/sample';
import { FileText, Clock, User, Activity, Printer } from 'lucide-react';
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

  const printLog = () => {
    let logContent = 'LOG ATTIVITÀ SISTEMA GESTIONE CAMPIONI\n';
    logContent += '======================================\n\n';
    logContent += `Stampato il: ${new Date().toLocaleString('it-IT')}\n`;
    logContent += `Totale registrazioni: ${logs.length}\n\n`;

    logs.forEach((log, index) => {
      logContent += `${index + 1}. ${log.action}\n`;
      logContent += `   Data/Ora: ${formatTimestamp(log.timestamp)}\n`;
      logContent += `   Operatore: ${log.operator}\n`;
      logContent += `   Tipo: ${log.itemType}\n`;
      logContent += `   Codice: ${log.itemCode}\n`;
      logContent += `   Dettagli: ${log.details}\n\n`;
    });

    // Create and download log
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `log_attivita_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    addLog('LOG_STAMPATO', 'Log delle attività stampato e scaricato', 'sample', '');
    toast.success('Log scaricato con successo');
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
          <Button onClick={printLog} variant="outline" size="sm" className="gap-2">
            <Printer className="w-4 h-4" />
            Stampa Log
          </Button>
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