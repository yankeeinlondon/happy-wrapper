import { 
  AsString, 
  Contains, 
  IsStringLiteral, 
  Narrowable, 
  Never, 
  isFunction, 
  isString 
} from "inferred-types";
import { 
  HappyDoc, 
  IElement, 
  IFragment, 
  createDocument, 
  createFragment, 
  isDocument, 
  isElement 
} from "./index";


export type HandlingApproach = "empty" | "throw" | "undefined" | (() => Narrowable);
export type DomSource = string | HappyDoc | Document | IFragment | IElement | HTMLElement;

export type MapContainerType<T extends DomSource> = T extends string
  ? IsStringLiteral<T> extends true
    ? Contains<AsString<T>,"<html>"> extends true
      ? HappyDoc
      : IFragment
  : HappyDoc | IFragment
: T extends HTMLElement 
  ? IElement
: T extends Document
  ? IElement
  : never;

export type MapContainerTypeName<T extends DomSource> = T extends string
? IsStringLiteral<T> extends true
  ? Contains<AsString<T>,"<html>"> extends true
    ? "HappyDoc"
    : "IFragment"
: "HappyDoc | IFragment"
: T extends HTMLElement 
? "IElement"
: T extends Document
? "IElement"
: never;

const containerName = <T extends DomSource>(node: T): MapContainerTypeName<T> => {
  return (
    isElement(node)
      ? "IElement"
      : isDocument(node)
      ? "HappyDoc"
      : isString(node)
        ? node.includes("<html>")
          ? "HappyDoc"
          : "IFragment"
      : "IElement"
  ) as MapContainerTypeName<T>
}

/**
 * ***query***`(node,sel,[throwIfMissing])`
 * 
 * A DOM query helper which takes an _input node_ and then uses querySelector()
 * to return the element if it's found.
 * 
 * If it is not found you can choose from the following behaviors:
 * 
 * - `empty` - by default if nothing is found then an empty object is returned
 * which allows you to _assume_ success using a syntax like `result?.textContent`
 * - `throw` - will throw a **DomError**
 * - `undefined` - returns an undefined value
 */
export const query = <
  T extends string | HappyDoc | Document | IFragment | IElement | HTMLElement,
  H extends HandlingApproach = "empty"
>(
  node: T, 
  sel: string,
  handling: H = "empty" as H
) => {
  let container: MapContainerType<T>;
  if (typeof node === "string") {
    if (node.includes("<html>")) {
      container = createDocument(node) as MapContainerType<T>;
    } else {
      container = createFragment(node) as MapContainerType<T>;
    }
  } else if (isDocument(node)) {
    container = node.body as MapContainerType<T>;
  } else if (isElement(node)) {
    container = node as IElement as MapContainerType<T>;
  } else {
    container = node as IFragment as MapContainerType<T>
  }


  const result = container.querySelector(sel);

  if (handling === "throw" && !result) {
    const err = new Error(`Failed to find an HTML element for the selector "${sel}"`) as Error & { 
      container: MapContainerTypeName<T>,
      selector: string;
    };
		err.name = "DomError";
    err.container = containerName(node);
    err.selector = sel;
		throw err;
  }

  return (
    result !== undefined
      ? result
      : handling === "empty" 
        ? {} as Record<string, undefined> 
        : handling === "undefined" ?  undefined : isFunction(handling) ? handling() : Never
  ) as H extends "throw" 
    ? IElement 
    : H extends "empty" 
    ? IElement | Record<string, undefined> 
    : H extends "undefined"
    ? IElement | undefined 
    : H extends () => unknown
    ? ReturnType<H>
    : never;
}

/**
 * **queryAll**
 */
export const queryAll = <
  T extends DomSource,
  H extends HandlingApproach = "empty"
>(
  dom: T, 
  sel: string
) => {
  let container: MapContainerType<T>;
  if (typeof dom === "string") {
    if (dom.includes("<html>")) {
      container = createDocument(dom) as MapContainerType<T>;
    } else {
      container = createFragment(dom) as MapContainerType<T>;
    }
  } else if (isDocument(dom)) {
    container = dom.body as MapContainerType<T>;
  } else if (isElement(dom)) {
    container = dom as IElement as MapContainerType<T>;
  } else {
    container = dom as IFragment as MapContainerType<T>
  }

  let result: Element[] = [];
  container.querySelectorAll(sel).forEach((i) => {
    if (isElement(i)) {
      result.push(i);
    }
  });

  return (
    result
  ) as IElement[]
}

export type TextCriteria = [
  criteria: "contains" | "startsWith" | "endsWith" | "doesNotContain",
  comparator: string
] | [
  criteria: "regex",
  comparator: RegExp
] | [
  criteria: "callback",
  comparator: (el: IElement) => boolean
];

/**
 * **findWhere**`(source, sel, handling, condition)`
 * 
 * Finds a single selection -- where possible -- that
 * meets the `sel` _selector_ criteria AND the text
 * criteria.
 * 
 * Note: because there is a callback option, this can classify on
 * more than text content but that is the primary driver.
 * 
 * **Related:** `findAllWhere()`
 */
export const findWhere = <
  TSource extends DomSource,
  TSelect extends string,
  TText extends TextCriteria,
  THandle extends HandlingApproach
>(
  source: TSource, 
  selector: TSelect, 
  handling: THandle, 
  ...text: TText) => {
  const results = Array.from(
    queryAll(source, selector)).filter(i => isElement(i)
  ) as IElement[];

  const [ criteria, comparator ] = text;
  let found = results.find(r => {
    const txt = r.textContent;
    switch(criteria) {
      case "callback":
        return comparator(r);
      case "contains":
        return txt.includes(comparator);
      case "endsWith":
        return txt.endsWith(comparator);
      case "startsWith":
        return txt.startsWith(comparator);
      case "doesNotContain":
        return !txt.includes(comparator);
      case "regex":
        return comparator.test(txt);
    }
  });

  if(!found && handling === "throw") {
    const err = new Error(
      `Failed to find any elements which met the selector "${selector}" as well as the "${criteria}" criteria of "${String(comparator)}"`
    ) as Error & { 
      container: MapContainerTypeName<TSource>,
      selector: string;
      criteria: string;
      comparator: string | RegExp | ((el: IElement) => unknown)
    };
		err.name = "DomError";
    err.container = containerName(source);
    err.selector = selector;
    err.criteria = criteria;
    err.comparator = comparator;
		throw err;
  }

  return (
    found
      ? found
      : handling === "undefined" 
        ? undefined 
        : handling === "empty"
          ? {} 
          : isFunction(handling)
            ? handling()
            : Never
  ) as unknown as THandle extends "throw" 
  ? IElement 
  : THandle extends "empty" 
  ? IElement | Record<string, undefined> 
  : THandle extends "undefined"
  ? IElement | undefined 
  : THandle extends () => unknown
  ? IElement | ReturnType<THandle>
  : never;
}


/**
 * **findAllWhere**`(source, selector, criteria, comparator)`
 * 
 * Finds all elements which meet both the _selector_ criteria
 * as well as `criteria/comparator` condition.
 */
export const findAllWhere = <
  TSource extends DomSource,
  TSelect extends string,
  TText extends TextCriteria,
>(
  source: TSource, 
  selector: TSelect, 
  ...text: TText
) => {
  const results = Array.from(
    queryAll(source, selector, "throw")).filter(i => isElement(i)
  ) as IElement[];

  const [ criteria, comparator ] = text;
  let found = results.filter(r => {
    const txt = r.textContent;
    switch(criteria) {
      case "callback":
        return comparator(r);
      case "contains":
        return txt.includes(comparator);
      case "endsWith":
        return txt.endsWith(comparator);
      case "startsWith":
        return txt.startsWith(comparator);
      case "doesNotContain":
        return !txt.includes(comparator);
      case "regex":
        return comparator.test(txt);
    }
  });


  return found as IElement[];
}
