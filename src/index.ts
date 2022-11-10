import {
  Document as HDocument,
  // use of Fragment offers less conflicts which can come into play with DocumentFragment
  DocumentFragment as HDocumentFragment,
  IElement as HElement,
  IText as HText,
  IComment as HComment,
  INode as HNode,
} from "happy-dom";

export type Document = HDocument;
export type HappyDoc = HDocument;
export type DocumentFragment = HDocumentFragment;
export type Fragment = HDocumentFragment;
/** An element in the DOM [happy-dom] */
export type IElement = HElement;
export type IComment = HComment;
export type IText = HText;
export type INode = HNode;

export * from "./attributes";
export * from "./create";
export * from "./diagnostics";
export * from "./errors";
export * from "./happy-types";
export * from "./nodes";
export * from "./select";
export * from "./type-guards";
export * from "./utils";
