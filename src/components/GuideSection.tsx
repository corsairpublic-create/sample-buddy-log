import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  HelpCircle, 
  Scan, 
  Archive, 
  Search, 
  Printer, 
  Settings, 
  Plus, 
  Shield,
  Workflow,
  BarChart,
  Mail
} from 'lucide-react';

export function GuideSection() {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Guida al Sistema di Gestione Campioni
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-foreground">
              Benvenuto nel sistema avanzato per la gestione, archiviazione e smaltimento dei campioni.
              Questa guida ti aiuterà a comprendere tutte le funzionalità disponibili.
            </p>
            
            <div className="bg-primary/5 p-4 rounded-lg">
              <h4 className="font-medium text-primary mb-2">Sviluppato da:</h4>
              <p className="text-sm">Buzle Francesco Tudor</p>
              <p className="text-xs text-muted-foreground mt-2">
                Per informazioni o domande contattare: francescobuzle@icloud.com
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="w-5 h-5" />
            Flusso di Lavoro Principale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium">Login</h4>
                  <p className="text-sm text-muted-foreground">Inserire le iniziali dell'operatore (almeno 2 caratteri)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium">Scansione Scaffale</h4>
                  <p className="text-sm text-muted-foreground">Scansionare il codice dello scaffale (inizia con SC, Scaffale o AL)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium">Scansione Cassetta</h4>
                  <p className="text-sm text-muted-foreground">Scansionare il codice della cassetta (inizia con CA, Cassetta o AL)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <h4 className="font-medium">Scansione Campione</h4>
                  <p className="text-sm text-muted-foreground">Scansionare il codice del campione (formato numerico: xxxxxxx-xxx)</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Functions Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Guida alle Funzioni</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="scanner">
              <AccordionTrigger className="flex items-center gap-2">
                <Scan className="w-4 h-4" />
                Scanner Codici a Barre
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <p>Il campo di scansione è sempre visibile e permette di:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Scansionare codici a barre con pistola scanner</li>
                    <li>Inserire manualmente i codici</li>
                    <li>Seguire il flusso: Scaffale → Cassetta → Campione</li>
                  </ul>
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-sm"><strong>Convenzioni codici:</strong></p>
                    <p className="text-xs">• Scaffali: SC-*, Scaffale-*, AL-*</p>
                    <p className="text-xs">• Cassette: CA-*, Cassetta-*, AL-*</p>
                    <p className="text-xs">• Campioni: formato numerico (es. 2501234-001)</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="search">
              <AccordionTrigger className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Funzione Cerca
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <p>La sezione di ricerca permette di:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Cercare campioni, cassette o scaffali per codice</li>
                    <li>Visualizzare la posizione esatta di ogni campione</li>
                    <li>Selezionare singoli elementi o gruppi</li>
                    <li>Smaltire o eliminare elementi selezionati</li>
                    <li>Spostare campioni tra cassette diverse</li>
                    <li>Vedere lo stato (attivo, smaltito, eliminato)</li>
                  </ul>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-success text-success-foreground">Attivo</Badge>
                    <Badge className="bg-warning text-warning-foreground">Smaltito</Badge>
                    <Badge className="bg-destructive text-destructive-foreground">Eliminato</Badge>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="print">
              <AccordionTrigger className="flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Stampa e Codici a Barre
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <p>La sezione stampa offre:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Generazione codici a barre Code-128</li>
                    <li>Stampa diretta su stampanti locali o di rete</li>
                    <li>Configurazione dimensioni personalizzate</li>
                    <li>Download dei codici a barre</li>
                    <li>Generazione report completi del sistema</li>
                    <li>Stampa report di elementi selezionati</li>
                  </ul>
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-sm"><strong>Stampa supportata:</strong></p>
                    <p className="text-xs">• Stampanti Windows locali e di rete</p>
                    <p className="text-xs">• Dimensioni personalizzabili in centimetri</p>
                    <p className="text-xs">• Formato Code-128 standard</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="manual">
              <AccordionTrigger className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Creazione Manuale
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <p>La creazione manuale consente di:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Creare scaffali senza scansione</li>
                    <li>Aggiungere cassette a scaffali esistenti</li>
                    <li>Inserire campioni direttamente nelle cassette</li>
                    <li>Seguire le convenzioni di nomenclatura</li>
                    <li>Ottenere anteprima del codice finale</li>
                  </ul>
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-sm"><strong>Tipologie automatiche:</strong></p>
                    <p className="text-xs">• TQ (tal quale): Scaffali SC + Cassette CA</p>
                    <p className="text-xs">• MC (macinato): Scaffali AL + Cassette AL</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="settings">
              <AccordionTrigger className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Impostazioni
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <p>Le impostazioni permettono di:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Modificare la password di eliminazione</li>
                    <li>Configurare stampante predefinita</li>
                    <li>Impostare dimensioni predefinite stampa</li>
                    <li>Visualizzare informazioni sistema</li>
                  </ul>
                  <div className="bg-destructive/10 p-3 rounded border border-destructive/20">
                    <p className="text-sm text-destructive"><strong>Sicurezza:</strong></p>
                    <p className="text-xs">Per modificare la password è necessario inserire quella precedente e confermare due volte la nuova password.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="logs">
              <AccordionTrigger className="flex items-center gap-2">
                <BarChart className="w-4 h-4" />
                Log delle Attività
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <p>Il log registra automaticamente:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Tutti i login/logout degli operatori</li>
                    <li>Creazione di scaffali, cassette e campioni</li>
                    <li>Scansioni e archiviazioni</li>
                    <li>Smaltimenti e eliminazioni</li>
                    <li>Modifiche alle impostazioni</li>
                    <li>Data, ora e dettagli di ogni azione</li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    Il log include una legenda colori per identificare rapidamente i tipi di azione.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Safety and Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Sicurezza e Protezione
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
              <h4 className="font-medium text-destructive mb-2">Eliminazione Campioni</h4>
              <p className="text-sm">
                Per eliminare definitivamente i campioni è richiesta la password speciale.
                L'eliminazione è irreversibile e viene registrata nel log.
              </p>
            </div>
            
            <div className="bg-warning/10 p-4 rounded-lg border border-warning/20">
              <h4 className="font-medium text-warning mb-2">Smaltimento</h4>
              <p className="text-sm">
                I campioni smaltiti non vengono eliminati dal sistema ma vengono contrassegnati
                come "smaltiti" e rimossi dalla visualizzazione attiva.
              </p>
            </div>
            
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h4 className="font-medium text-primary mb-2">Log delle Attività</h4>
              <p className="text-sm">
                Tutte le azioni vengono registrate con timestamp, operatore e dettagli.
                Questo garantisce tracciabilità completa del sistema.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Supporto e Contatti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="font-medium">Programma sviluppato da</p>
              <p className="text-lg font-bold text-primary">Buzle Francesco Tudor</p>
              <p className="text-sm text-muted-foreground mt-2">
                Per informazioni o domande contattare:
              </p>
              <p className="font-medium">francescobuzle@icloud.com</p>
            </div>
            
            <div className="text-xs text-muted-foreground text-center">
              <p>Sistema di Gestione Campioni v1.0.0</p>
              <p>Tutte le funzionalità sono integrate e pronte all'uso.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}