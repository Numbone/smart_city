// i18n/config.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Импорт переводов
import translationEN from './locales/en/translation.json'
import translationRU from './locales/ru/translation.json'
import translationKK from './locales/kk/translation.json'

const resources = {
  en: {
    translation: translationEN
  },
  ru: {
    translation: translationRU
  },
  kk: {
    translation: translationKK
  }
}

i18n
  .use(LanguageDetector) // Автоопределение языка
  .use(initReactI18next) // Интеграция с React
  .init({
    resources,
    fallbackLng: 'ru', // Язык по умолчанию
    lng: 'ru', // Начальный язык
    debug: false,
    
    interpolation: {
      escapeValue: false // React уже защищает от XSS
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  })

export default i18n