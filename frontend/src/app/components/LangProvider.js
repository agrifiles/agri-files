'use client';

import { createContext, useState } from "react";
import translations from "./translations";

export const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState("en");
  const toggleLang = () => setLang(lang === "en" ? "mr" : "en");
  const t = translations[lang];

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}
