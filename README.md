<p align="center">
  <h1 align="center"><code>@nanokit/i18n</code></h1>
  <h4 align="center">Typesafe and customizable i18n in ~1 kb.</h4>
</p>

## Introduction

`@nanokit/i18n` lets you write translations with

- **variables**: `"My name is {{name}}"`
- **pluralization**: `"{{count}} (apple|apples)"`
- **custom transforms on variables**: `"Good luck with your {{count:ordinal}} try"`.

For many use cases, this is all you need.

The variable types are automatically inferred to make your translations **fully typesafe**:

```ts
const english = {
  introduceMyself: `"My name is {{name}}"`,
};

const t = createTranslator(english);

t.introduceMyself({ name: "John" });
//                ^? { name: string }
// outputs: "My name is John"
```

## Getting started

- Install the package:

```bash
# npm
npm install @nanokit/i18n

# yarn
yarn add @nanokit/i18n

# pnpm
pnpm add @nanokit/i18n
```

- Create a file for a particular language

```ts
// languages/en.ts

export const modifiers = {
  ... // examples below
}

export const translation = {
  ... // examples below
} as const

```

- and get access to your typesafe translations with the usual `t` thing:

```ts
// translation.ts

import { createTranslator } from "@nanokit/i18n";
import { translation, modifiers } from "./languages/en";

export const t = createTranslator(translation, modifiers);

// example usage below
```

**_Note: Ideally, languages should be automatically detected and lazy loaded as needed. This is currently achieved with the `React` adapter (see below)._**

## Examples

Write an object for a specific language like this:

```ts
// languages/en.ts

...

export const translation = {
  general: {
    hello: "Hello!",
    introduce: "My name is {{name}}",
    introduceSomeoneElse: "{{gender:pronoun_possessive}} name is {{name}}",
  },
  things: {
    apples: "Here (is|are) {{count}} (apple|apples)",
    deleteItems: "Delete {{count:numeral}} (item|items)",
  },
} as const;
```

and you can use your translations like this:

```ts
import { t } from "./translation";

t.general.hello();
// outputs: "Hello!"

t.general.introduce({ name: "John" });
//                  ^? { name: string }
// outputs: "My name is John"

t.general.introduceSomeoneElse({ gender: "female", name: "Jane" });
//                             ^? { gender: "male" | "female" | "neutral", name: string }
// outputs: "her name is Jane"

t.general.introduceSomeoneElse({ gender: "male", name: "John" });
// outputs: "his name is John"

t.things.apples({ count: 1 });
// outputs: "Here is 1 apple"

t.things.apples({ count: 2 });
// outputs: "Here are 2 apples"

t.things.deleteItems({ count: 1 });
// outputs: "Delete one item"

t.things.deleteItems({ count: 2 });
// outputs: "Delete two items"
```

## Custom modifiers

What's this `{{variable:something}}` pattern all about? The tag `:something` represents a fully customizable modifier that give you infinite flexibility without bloating your translation strings with custom logic.

Simply define your modifier functions for each language:

```ts
// languages/en.ts

const modifiers = {
  pronoun_possessive: (gender: "male" | "female" | "neutral") => {
    return { male: "his", female: "her", neutral: "their" }[gender];
  };
}

...
```

Now, if you write `{{gender:pronoun_possessive}}` in your translation string, the `gender` variable automatically expects the value `"male" | "female" | "neutral"`, and it will output "his", "her", or "their".

### Multiple modifiers

You can add multiple modifiers for each variable, e.g. `{{gender:pronoun_possessive:capitalize}}`.

## React adapter

Use `@nanokit/i18n` with `React` and lazy loading:

```ts
// translation-react.ts

import { translation, modifiers } from "./languages/en.ts";

// Define your general language model from the primary language.
// you can use this type for other languages to make sure
// they have the same keys, variables, and modifiers.
type LanguageModel = {
  translation: typeof translation;
  modifiers: typeof modifiers;
};

// Create provider component and hook
export const { TranslationProvider, useTranslation } = initI18n({
  // specify accessible languages:
  languages: ["en", "de", "fr", "es"],

  // create a loader for lazy loading languages:
  loader: async (language: string) => {
    return (await import(`./languages/${language}.ts`)) as LanguageModel;
  },

  // specify a primary language that will be preloaded:
  fallback: {
    language: "en",
    translation,
    modifiers,
  },
});
```

Wrap your app in the provider and (optionally) specify the language through its `language` prop. Now you can use the hook `useTranslation`:

```ts
function PresentName() {
  const t = useTranslation();

  return <>{t.introduce({ name: "John" })}</>; // "My name is John"
}
```

## Reference modifiers safely

The library lets you create a utility, `m`:

```ts
import { createModifierHelper } from "@nanokit/i18n";

const m = createModifierHelper(modifiers);
```

This gives you typesafety when using modifiers:

```ts
`${m.pronoun_possessive("gender")} name is {{name}}`;
// equivalent to: "{{gender:pronoun_possessive}} name is {{name}}";
```

With this utility you avoid spelling mistakes and avoid using non-existent modifiers.

Nesting is also possible:

```ts
m.capitalize(m.pronoun_possessive("gender"));
// equivalent to: "{{gender:pronoun_possessive:capitalize}}"
```
