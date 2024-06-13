import { AsString, Contains, IsStringLiteral, isString } from "inferred-types";
import { HappyDoc, IElement, IFragment, createDocument, createFragment, isDocument, isElement } from ".";


export type HandlingApproach = "empty" | "throw" | "undefined";

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
      : handling === "empty" ? {} as Record<string, undefined> : undefined
  ) as H extends "throw" ? IElement : H extends "empty" ? IElement | Record<string, undefined> : IElement | undefined ;
}

export const queryAll = <
  T extends string | HappyDoc | Document | IFragment | IElement | HTMLElement,
  H extends HandlingApproach = "empty"
>(
  dom: T, 
  sel: string,
  handling: H = "empty" as H
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


  const result = container.querySelectorAll(sel);

  if (handling === "throw" && !result) {
    const err = new Error(`Failed to find an HTML element for the selector "${sel}"`) as Error & { 
      node: T,
      container: MapContainerTypeName<T>,
      selector: string;
    };
		err.name = "DomError";
		// err.dom = dom;
    err.container = containerName(dom);
    err.selector = sel;
		throw err;
  }

  return (
    result !== undefined
      ? result
      : handling === "empty" ? {} as Record<string, undefined> : undefined
  ) as H extends "throw" 
    ? NodeList
    : H extends "empty" 
    ? NodeList | Record<string, undefined> 
    : NodeList | undefined;
}


