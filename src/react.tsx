import React from "react";
import type { Modifiers, Translation, Translator } from ".";
import { createTranslator } from ".";

const useLoadTranslation = <T extends Translation, M extends Modifiers>(
  language: string | undefined,
  {
    fallback,
    loader,
  }: {
    fallback: { language: string; translation: T; modifiers: M };
    loader: (
      locale: string
    ) => Promise<{ translation: T; modifiers: M } | undefined>;
  }
) => {
  const [isLoaded, setIsLoaded] = React.useState(false);

  const selected = React.useRef<{
    language: string;
    translation: T;
    modifiers: M;
  }>(fallback);

  const loaderRef = React.useRef(loader);
  React.useLayoutEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  React.useLayoutEffect(() => {
    if (!language || selected.current.language === language) return;
    loaderRef
      .current(language)
      .then((mod) => mod && (selected.current = { language, ...mod }))
      .finally(() => setIsLoaded(true));
  }, [language]);

  const t = React.useMemo(() => {
    const { translation, modifiers } = selected.current;
    return createTranslator(translation, modifiers);
  }, [isLoaded]);

  return t;
};

export const initI18n = <
  const L extends readonly string[],
  T extends Translation,
  M extends Modifiers
>(options: {
  languages: L;
  fallback: { language: L[number]; translation: T; modifiers: M };
  loader: (
    locale: string
  ) => Promise<{ translation: T; modifiers: M } | undefined>;
}) => {
  type BaseTranslator = Translator<T, M>;
  const TranslationContext = React.createContext<BaseTranslator | null>(null);

  function TranslationProvider({
    children,
    language,
  }: {
    children: React.ReactNode;
    language?: L[number];
  }) {
    const t = useLoadTranslation(language, options);

    return (
      <TranslationContext.Provider value={t}>
        {children}
      </TranslationContext.Provider>
    );
  }
  const useTranslation = () => {
    const ctx = React.useContext(TranslationContext) as Translator<T, M>;
    if (!ctx) {
      throw new Error(
        "useTranslation must be used within a TranslationProvider"
      );
    }
    return ctx;
  };

  return { TranslationProvider, useTranslation, TranslationContext };
};
