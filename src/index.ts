import type { GetVariables, Modifiers, Translation } from "./types";
import { replacePlaceholders } from "./placeholders";

export type NumbersTranslation = {
  numerals: Record<number, string>;
  ordinals: Record<number | "defaultSuffix", string>;
};

export type { Translation, Modifiers };

type Optionalize<T extends [object]> = keyof T[0] extends never
  ? []
  : keyof T[0] extends "count"
  ? [variables?: { count?: number }]
  : T;

export type Translator<T extends Translation, M extends Modifiers> = {
  [Namespace in keyof T]: {
    [Key in keyof T[Namespace]]: (
      ...arr: Optionalize<[variables: GetVariables<T[Namespace][Key], M>]>
    ) => string;
  };
};

export const createTranslator = <
  TTranslation extends Translation,
  TModifiers extends Modifiers
>(
  translation: TTranslation,
  modifiers: TModifiers
) => {
  return new Proxy({} as Translator<TTranslation, TModifiers>, {
    get(_, namespace) {
      return new Proxy(
        {},
        {
          get(_, key) {
            const string = translation[namespace as string]?.[key as string];
            return (obj?: any) => {
              return replacePlaceholders(string, obj, modifiers);
            };
          },
        }
      );
    },
  });
};

type ModifierHelper<Name extends string> = {
  <Variable extends string>(name: `{{${Variable}}}`): `{{${Variable}:${Name}}}`;
  <Variable extends string>(name: Variable): `{{${Variable}:${Name}}}`;
};

export const createModifierHelper = <const T extends Modifiers>(object: T) => {
  return Object.fromEntries(
    Object.keys(object).map((key) => {
      const func: ModifierHelper<typeof key> = <Variable extends string>(
        variable: Variable
      ) => {
        return `{{${variable.replace(
          /^(\{\{)?([^}]+)(\}\})?$/,
          "$2"
        )}:${key}}}`;
      };

      return [key, func];
    })
  ) as {
    [Key in keyof T]: Key extends string ? ModifierHelper<Key> : never;
  };
};
