import { useState, useEffect } from 'react';

export function useSubmittingDots(isSubmitting: boolean) {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    if (!isSubmitting) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '.' : `${prev}.`));
    }, 300);

    return () => clearInterval(interval);
  }, [isSubmitting]);

  return dots;
}
