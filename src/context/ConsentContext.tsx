import { createContext, ReactNode, useContext, useState } from 'react';

type ConsentChoice = 'accepted' | 'rejected' | null;
type ConsentContextValue = { choice: ConsentChoice; setChoice: (choice: Exclude<ConsentChoice, null>) => void };

const STORAGE_KEY = 'doctor-tech-analytics-consent';
const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

function savedChoice(): ConsentChoice {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    return null;
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [choice, updateChoice] = useState<ConsentChoice>(savedChoice);
  const setChoice = (nextChoice: Exclude<ConsentChoice, null>) => {
    try {
      localStorage.setItem(STORAGE_KEY, nextChoice);
      if (nextChoice === 'rejected') {
        localStorage.removeItem('doctor-tech-regional-visitor');
        localStorage.removeItem('doctor-tech-pwa-install-reported');
      }
    } catch { /* Consent is still applied in memory for this visit. */ }
    updateChoice(nextChoice);
  };
  return <ConsentContext.Provider value={{ choice, setChoice }}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) throw new Error('useConsent must be used within ConsentProvider');
  return context;
}
