import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Beaker, User } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (operator: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [initials, setInitials] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initials.trim().length >= 2) {
      onLogin(initials.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Beaker className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-primary">
              Sistema Gestione Campioni
            </CardTitle>
            <CardDescription className="mt-2">
              Sistema avanzato per la gestione, archiviazione e smaltimento dei campioni
              <br />
              <span className="text-sm font-medium">a cura di Buzle Francesco Tudor</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="initials" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Iniziali Operatore
              </Label>
              <Input
                id="initials"
                type="text"
                placeholder="Es. FT, AB, etc."
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
                className="text-center uppercase"
                maxLength={4}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Inserire almeno 2 caratteri per identificare l'operatore
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={initials.trim().length < 2}
            >
              Accedi al Sistema
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}