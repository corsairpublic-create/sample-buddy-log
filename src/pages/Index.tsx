import { useState } from 'react';
import { LoginScreen } from '@/components/LoginScreen';
import { MainInterface } from '@/components/MainInterface';

const Index = () => {
  const [currentOperator, setCurrentOperator] = useState<string | null>(null);

  const handleLogin = (operator: string) => {
    setCurrentOperator(operator);
  };

  const handleLogout = () => {
    setCurrentOperator(null);
  };

  if (!currentOperator) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <MainInterface 
      operator={currentOperator} 
      onLogout={handleLogout}
    />
  );
};

export default Index;
