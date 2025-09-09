import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archive, RotateCcw, CheckCircle, Circle } from 'lucide-react';

interface ArchivingStatusProps {
  archivingState: {
    currentShelf?: string;
    currentBox?: string;
    step: 'shelf' | 'box' | 'sample';
  };
  onReset: () => void;
}

export function ArchivingStatus({ archivingState, onReset }: ArchivingStatusProps) {
  const steps = [
    { key: 'shelf', label: 'Scaffale', icon: Circle },
    { key: 'box', label: 'Cassetta', icon: Circle },
    { key: 'sample', label: 'Campione', icon: Circle }
  ];

  const getStepStatus = (stepKey: string) => {
    const stepIndex = steps.findIndex(s => s.key === stepKey);
    const currentIndex = steps.findIndex(s => s.key === archivingState.step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStepIcon = (stepKey: string) => {
    const status = getStepStatus(stepKey);
    return status === 'completed' ? CheckCircle : Circle;
  };

  const getStepVariant = (stepKey: string) => {
    const status = getStepStatus(stepKey);
    switch (status) {
      case 'completed': return 'default';
      case 'current': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-accent">
            <Archive className="w-5 h-5" />
            Stato Archiviazione
          </CardTitle>
          <Button onClick={onReset} variant="outline" size="sm" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const StepIcon = getStepIcon(step.key);
            return (
              <div key={step.key} className="flex items-center">
                <Badge variant={getStepVariant(step.key)} className="gap-2">
                  <StepIcon className="w-4 h-4" />
                  {step.label}
                </Badge>
                {index < steps.length - 1 && (
                  <div className="w-8 h-0.5 bg-border mx-2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Current values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Scaffale corrente:</p>
            <p className="font-medium">{archivingState.currentShelf || 'Non selezionato'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cassetta corrente:</p>
            <p className="font-medium">{archivingState.currentBox || 'Non selezionata'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Prossimo passo:</p>
            <p className="font-medium">
              {archivingState.step === 'shelf' && 'Scansiona scaffale'}
              {archivingState.step === 'box' && 'Scansiona cassetta'}
              {archivingState.step === 'sample' && 'Scansiona campione'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}