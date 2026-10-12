import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tribbus_custom_logo_v3';
const EVENT_NAME = 'tribbus_logo_updated';

export function getAppLogo(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(STORAGE_KEY);
    if (custom && !custom.includes('tribbus3.png') && !custom.includes('tribbus_header.png')) {
      return custom;
    }
  }
  return '/logo.png';
}

export function getHeaderLogo(): string {
  return '/logo.png';
}

export function setAppLogo(dataUrl: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, dataUrl);
    window.dispatchEvent(new Event(EVENT_NAME));
  }
}

export function resetAppLogo(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(EVENT_NAME));
  }
}

export function useAppLogo(): { logoSrc: string; isCustom: boolean; updateLogo: (file: File) => Promise<void>; resetLogo: () => void } {
  const [logoSrc, setLogoSrc] = useState<string>(getAppLogo());
  const [isCustom, setIsCustom] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    const handleUpdate = () => {
      const current = getAppLogo();
      setLogoSrc(current);
      setIsCustom(!!localStorage.getItem(STORAGE_KEY));
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateLogo = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAppLogo(reader.result);
          resolve();
        } else {
          reject(new Error('Falha ao ler arquivo de imagem'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  return { logoSrc, isCustom, updateLogo, resetLogo: resetAppLogo };
}
