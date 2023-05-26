export type Translation = Record<string, Record<string, string>>;

export type Modifiers = Record<string, (value: any) => string | number>;

type Prettify<T> = { [Key in keyof T]: T[Key] } & {};

// The double "extends" is necessary to make sure IsAny<[not any]>
// returns *false* and not *boolean*.
type IsAny<T> = (any extends T ? true : false) extends true ? true : false;

type WithVariableAndModifier<
  TName extends string,
  TModifier extends string,
  TRest extends string
> = `${string}{{${TName}:${TModifier}}}${TRest}`;
type WithVariable<
  TName extends string,
  TRest extends string
> = `${string}{{${TName}}}${TRest}`;

// WithVariableInBetween is used to make sure that the string
//    "text {{foo}} text {{bar:numeral}} text"
// does not result in a variable named
//    "foo}} text {{bar"
// when using WithVariableAndModifier
type WithVariableInBetween<
  TName extends string,
  TRest extends string
> = `${TName}}}${TRest}`;

type GetFirstKey<TKey extends string> =
  TKey extends `${infer FirstKey}:${string}` ? FirstKey : TKey;

type GetTypeFromModifier<
  TModifiers extends Modifiers,
  TKey extends keyof TModifiers
> = TKey extends keyof TModifiers ? Parameters<TModifiers[TKey]>[0] : never;

type GetVariablesImpl<
  TString extends string,
  TObject extends { [key: string]: string | number },
  TModifiers extends Modifiers
> = TString extends WithVariableAndModifier<
  infer VariableName,
  infer ModifierKey,
  infer Rest
>
  ? VariableName extends WithVariableInBetween<
      infer VariableNameCorrected,
      infer InBetween
    >
    ? GetVariablesImpl<
        `${InBetween}:${ModifierKey}}}${Rest}`,
        TObject & { [key in VariableNameCorrected]: string | number },
        TModifiers
      >
    : GetVariablesImpl<
        `${Rest}`,
        TObject & {
          [key in VariableName]: GetTypeFromModifier<
            TModifiers,
            GetFirstKey<ModifierKey>
          >;
        },
        TModifiers
      >
  : TString extends WithVariable<infer VariableName, infer Rest>
  ? GetVariablesImpl<
      Rest,
      TObject & { [key in VariableName]: string | number },
      TModifiers
    >
  : TString extends `${string}(${string}|${string})${string}`
  ? Prettify<TObject & { count?: number }>
  : Prettify<TObject>;

// TypeScript IntelliSense enters an infinite loading state if "any"
// is passed to GetVariables without it being handled separately.
export type GetVariables<
  TString extends string,
  TModifiers extends Modifiers
> = IsAny<TString> extends true
  ? {}
  : GetVariablesImpl<TString, {}, TModifiers>;
