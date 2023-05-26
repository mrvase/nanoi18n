import { it, expect } from "vitest";
import { createModifierHelper, createTranslator } from "../src";

const pronounModifiers = {
  pronoun_subjective: (input: Gender) => {
    return { male: "he", female: "she", neutral: "they" }[input];
  },
  pronoun_objective: (input: Gender) => {
    return { male: "him", female: "her", neutral: "them" }[input];
  },
  pronoun_possessive: (input: Gender) => {
    return { male: "his", female: "her", neutral: "their" }[input];
  },
};

const numberModifiers = {
  number: (value: number) => Number(value),
  numeral: (value: number) => {
    const numerals: Record<number, string> = {
      0: "zero",
      1: "one",
      2: "two",
      3: "three",
      4: "four",
      5: "five",
      6: "six",
      7: "seven",
      8: "eight",
      9: "nine",
      10: "ten",
    };
    return numerals[value] ?? value;
  },
  ordinal: (value: number) => {
    const ordinals: Record<number | "defaultSuffix", string> = {
      1: "1st",
      2: "2nd",
      3: "3rd",
      defaultSuffix: "th",
    };
    return ordinals[value] ?? `${value}${ordinals.defaultSuffix}` ?? value;
  },
};

const textModifiers = {
  capitalize: (input: string) => input[0].toUpperCase() + input.slice(1),
};

const modifiers = {
  ...textModifiers,
  ...numberModifiers,
  ...pronounModifiers,
};

const m = createModifierHelper(modifiers);

const translation = {
  general: {
    hello: "Hello",
    name: "My name is {{name}}",
    apples: "There is {{count}} (apple|apples) in the basket",
    applesNumeral: `${m.numeral("count")} (apple|apples) in the basket`,
    numeral: `${m.numeral("count")}`,
    capitalizedNumeral: `${m.capitalize(m.numeral("count"))}`,
    // prettier-ignore
    phoneBack: `${m.pronoun_subjective("gender")} would like you to give ${m.pronoun_objective("gender")} ${m.pronoun_possessive("gender")} phone back`,
  },
} as const;

type Gender = "male" | "female" | "neutral";

const t = createTranslator(translation, modifiers);

it("resolves to string", () => {
  expect(t.general.hello()).toBe("Hello");
});

it("resolves to string with modifiers", () => {
  expect(t.general.name({ name: "John" })).toBe("My name is John");
});

it("resolves singular/plural", () => {
  expect(t.general.apples()).toBe("There is 1 apple in the basket");
  expect(t.general.apples({})).toBe("There is 1 apple in the basket");
  expect(t.general.apples({ count: 0 })).toBe(
    "There is 0 apples in the basket"
  );
  expect(t.general.apples({ count: 1 })).toBe("There is 1 apple in the basket");
  expect(t.general.apples({ count: 2 })).toBe(
    "There is 2 apples in the basket"
  );
});

it("resolves numeral based on count variable", () => {
  expect(t.general.applesNumeral()).toBe("one apple in the basket");
  expect(t.general.applesNumeral({ count: 0 })).toBe(
    "zero apples in the basket"
  );
  expect(t.general.applesNumeral({ count: 1 })).toBe("one apple in the basket");
});

it("resolves custom modifier based on custom variable", () => {
  expect(t.general.phoneBack({ gender: "male" })).toBe(
    "he would like you to give him his phone back"
  );
  expect(t.general.phoneBack({ gender: "female" })).toBe(
    "she would like you to give her her phone back"
  );
  expect(t.general.phoneBack({ gender: "neutral" })).toBe(
    "they would like you to give them their phone back"
  );
});

it("resolves multiple custom modifiers on same variable", () => {
  expect(t.general.numeral({ count: 1 })).toBe("one");
  expect(t.general.capitalizedNumeral({ count: 1 })).toBe("One");
  expect(t.general.numeral({ count: 2 })).toBe("two");
  expect(t.general.capitalizedNumeral({ count: 2 })).toBe("Two");
});
