/* eslint-disable no-use-before-define */
import { createFragment } from "./create";
import type {
  Container,
  DocRoot,
  InspectionTuple,
  UpdateSignature,
} from "./happy-types";
import type { HappyMishap } from "./errors";
import type { IFragment, HappyDoc, IElement, IText, INode } from "./index";
import { isObject } from "inferred-types";

export function isHappyWrapperError(err: unknown): err is HappyMishap {
  return typeof err === "object" && (err as any).kind === "HappyWrapper";
}

export const isInspectionTuple = (thing: unknown): thing is InspectionTuple => {
  return (
    Array.isArray(thing) &&
    thing.length === 2 &&
    typeof thing[0] === "string" &&
    !Array.isArray(thing[1])
  );
};

export function isDocument(dom: unknown): dom is HappyDoc {
  return (
    typeof dom === "object" && dom !== null && !isElement(dom) && "body" in dom
  );
}
export function isFragment(dom: unknown): dom is IFragment {
  return (
    typeof dom === "object" &&
    dom !== null &&
    !isElement(dom) &&
    !isTextNode(dom) &&
    !("body" in dom)
  );
}

export const nodeStartsWithElement = <D extends DocRoot>(node: D) => {
  return !!(
    "firstElementChild" in node &&
    "firstChild" in node &&
    "firstElementChild" in node &&
    (node as INode).firstChild === (node as DocRoot).firstElementChild
  );
};
export const nodeEndsWithElement = <D extends DocRoot>(node: D) => {
  return "lastElementChild" in node && node.lastChild === node.lastElementChild;
};

export const nodeBoundedByElements = <D extends DocRoot>(node: D) => {
  return nodeStartsWithElement(node) && nodeEndsWithElement(node);
};

/**
 * tests whether a given node has a singular Element as a child
 * of the given node
 */
export const hasSingularElement = <N extends DocRoot>(node: N) => {
  return nodeBoundedByElements(node) && node.childNodes.length === 1;
};

export function isElement(el: unknown): el is IElement {
  return (
    typeof el === "object" &&
    el !== null &&
    "outerHTML" in (el as object) &&
    (el as IElement).nodeType === 1
  );
}

export const isHtmlElement = <T>(val: T): val is T & HTMLElement => {
  return isObject(val) && "nodeType" in val && val.nodeType === 1;
}

/**
 * determines if a Doc/DocFragment is a wrapper for only a singular
 * `IElement` node
 */
export const isElementLike = (container: unknown) => {
  if (isDocument(container)) {
    return (
      container.body.childNodes.length === 1 &&
      container.body.firstChild === container.body.firstElementChild
    );
  }

  return (
    isFragment(container) &&
    container.childNodes.length === 1 &&
    container.firstChild === container.firstElementChild
  );
};

/**
 * Tests whether a doc type is wrapping only a text node
 */
export function isTextNodeLike(node: unknown) {
  return (
    (isDocument(node) || isFragment(node)) &&
    node?.childNodes?.length === 1 &&
    isTextNode(node.firstChild)
  );
}

/**
 * Type guard which detects that the incoming calling signature matches
 * that of the `select()` utilities update/updateAll operation.
 */
export const isUpdateSignature = (args: unknown): args is UpdateSignature => {
  return (
    Array.isArray(args) &&
    args.length === 3 &&
    // && (typeof args[0] === 'string' || typeof args[0] === 'object')
    typeof args[1] === "number" &&
    typeof args[2] === "number"
  );
};

export function isTextNode(node: unknown): node is IText {
  if (typeof node === "string") {
    const test = createFragment(node);
    return isTextNodeLike(test);
  } else {
    return (
      typeof node === "object" &&
      node !== null &&
      !("firstElementChild" in (node as any))
    );
  }
}

export const isContainer = (thing: unknown): thing is Container => {
  return (
    isDocument(thing) ||
    isFragment(thing) ||
    isElement(thing) ||
    isTextNode(thing)
  );
};

/**
 * detects whether _all_ children of a give node are Elements
 */
export const nodeChildrenAllElements = <D extends DocRoot>(node: D) => {
  return node.childNodes.every((n) => isElement(n));
};
