import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Scan } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  isProcessing?: boolean;
  placeholder?: string;
}

export function BarcodeScanner({ onScan, isProcessing = false, placeholder = "Scansiona o inserisci codice..." }: BarcodeScannerProps) {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onScan(code.trim());
      setCode('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-primary">
          <QrCode className="w-5 h-5" />
          Scanner Codici a Barre
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isProcessing}
              className="pr-10"
              autoFocus
            />
            <Scan className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          <Button 
            type="submit" 
            disabled={!code.trim() || isProcessing}
            className="min-w-[100px]"
          >
            {isProcessing ? 'Elaborando...' : 'Scansiona'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}