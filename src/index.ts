import type {
  Document as HDoc,
  // use of Fragment offers less conflicts which can come into play with DocumentFragment
  DocumentFragment,
  HTMLElement as HElement,
  Text,
  Comment as HComment,
  Node
} from "happy-dom-without-node";

/**
 * A DOM document originated from Happy DOM and renamed from
 * `Document` so as to avoid possible conflicts with Typescript's
 * built in `Document` type.
 */
export interface HappyDoc extends HDoc {}
/** a document in happy-dom */
export type IDocument = Document;
/** a document fragment [happy-dom] */
export type IDocumentFragment = DocumentFragment;
/** a document fragment [happy-dom] */
export type IFragment = DocumentFragment;
/** An element in the DOM [happy-dom] */
export type IElement = HElement & HTMLElement;
/** a comment node in happy-dom */
export type IComment = HComment;
/** A text node in happy-dom */
export type IText = Text;
export type INode = Node;

export * from "./attributes";
export * from "./create";
export * from "./diagnostics";
export * from "./errors";
export * from "./happy-types";
export * from "./nodes";
export * from "./select";
export * from "./type-guards";
export * from "./utils";
export * from "./helpers";
