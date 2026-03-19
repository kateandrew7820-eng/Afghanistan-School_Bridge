import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation as useTranslationBase } from 'react-i18next';

interface LocalizationContextType {
  language: string;
  isRTL: boolean;
  setLanguage: (lang: string) => void;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState('fa');
  const [isRTL, setIsRTL] = useState(true);
  const { i18n } = useTranslationBase();

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    // Update HTML lang and dir attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    setIsRTL(lang === 'fa');
    localStorage.setItem('language', lang);
  };

  useEffect(() => {
    // Initialize with saved language or default to Persian
    const savedLang = localStorage.getItem('language') || 'fa';
    if (savedLang !== language) {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    // Apply RTL/LTR to document
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.setAttribute('class', isRTL ? 'rtl' : 'ltr');
  }, [isRTL, language]);

  return (
    <LocalizationContext.Provider value={{ language, isRTL, setLanguage }}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }
  return context;
}

// Custom hook that combines i18n translation with localization context
export function useTranslation() {
  const { t, i18n } = useTranslationBase();
  const { isRTL } = useLocalization();
  
  return { t, i18n, isRTL };
}
