import { flow, pipe } from "fp-ts/lib/function.js";
import {
  createCommentNode,
  createDocument,
  createElement,
  createFragment,
  createTextNode,
} from "./create";
import { HappyMishap } from "./errors";
import type {
  Container,
  ContainerOrHtml,
  HTML,
  NodeSolver,
  NodeSolverReceiver,
  NodeType,
} from "./happy-types";
import {
  isDocument,
  isElement,
  isElementLike,
  isFragment,
  isTextNode,
} from "./type-guards";

/**
 * Use the self-reported numeric type that a node presents
 * to identify what type it is.
 */
export const nodeTypeLookup = (type: number): NodeType | undefined => {
  switch (type) {
    case 1: {
      return "element";
    }
    case 3: {
      return "text";
    }
    case 8: {
      return "comment";
    }
    case 11: {
      return "fragment";
    }
  }
};

/**
 * Determines the "content-type" of a given node
 */
export const getNodeType = (node: Container | HTML): NodeType => {
  if (typeof node === "string") {
    return "html";
  }

  const byType = nodeTypeLookup(node.nodeType);

  if (byType) {
    return byType;
  }

  return isTextNode(node)
    ? "text"
    : isElement(node)
    ? "element"
    : isDocument(node)
    ? "document"
    : isFragment(node)
    ? "fragment"
    : "node";
};

/**
 * A helper utility to help convert DOM nodes or HTML to common type.
 *
 * Start by providing the _exclusions_ you want to make for input. By default, all
 * `Container` types are allowed along with `HTML`
 */
export const solveForNodeType: NodeSolver = (_ = undefined as never) => {
  const solver = <EE extends NodeType, OO>(): NodeSolverReceiver<EE, OO> => ({
    solver: (s) => (node, parent) => {
      if (node === null) {
        throw new Error("Value passed into solver was NULL!");
      }
      if (node === undefined) {
        throw new Error("Value passed into solver was UNDEFINED!");
      }

      const type = getNodeType(node);
      if (type in s) {
        const fn = (s as any)[type];
        return fn(node, parent);
      } else {
        if (type === "node" && "element" in s && isElement(node)) {
          const fn = (s as any).element;
          return fn(node, parent);
        } else if (type === "node" && "text" in s && isTextNode(node)) {
          const fn = (s as any).text;
          return fn(node);
        }

        throw new HappyMishap(`Problem finding "${type}" in solver.`, {
          name: `solveForNodeType(${type})`,
        });
      }
    },
  });
  return {
    outputType: () => solver(),
    mirror: () => solver(),
  };
};

/**
 * Ensures any Container, array of Containers, or even HTML or HTML[] are all
 * normalized down to just HTML.
 */
export function toHtml<D extends ContainerOrHtml | ContainerOrHtml[] | null>(
  node: D
): HTML {
  if (node === null) {
    return "";
  }

  const n = (Array.isArray(node) ? node : [node]) as ContainerOrHtml[];
  try {
    const results = n.map((i) => {
      const convert = solveForNodeType()
        .outputType<HTML>()
        .solver({
          html: (h) => h,
          text: (t) => t.textContent,
          comment: (h) => `<!-- ${h.textContent} -->`,
          element: (e) => e.outerHTML,
          node: (ne) => {
            if (isElement(ne)) {
              convert(ne);
            }
            if (isTextNode(ne)) {
              convert(ne);
            }

            throw new Error(
              `Unknown node type detected while converting to HTML: [ name: ${ne.nodeName}, type: ${ne.nodeType}, value: ${ne.nodeValue} ]`
            );
          },
          document: (d) =>
            `<html>${d.head.hasChildNodes() ? d.head.outerHTML : ""}${
              d.body.outerHTML
            }</html>`,
          fragment: (f) => {
            return isElementLike(f)
              ? f.firstElementChild.outerHTML
              : f.childNodes.map((c) => convert(c, f)).join("");
          },
        });

      return convert(i);
    });

    return results.join("");
  } catch (error_) {
    const error = Array.isArray(node)
      ? new HappyMishap(
          `Problem converting an array of ${n.length} nodes [${n
            .map((i) => getNodeType(i as any))
            .join(", ")}] to HTML`,
          {
            name: "toHTML([...])",
            inspect: ["first node", node[0]],
            error: error_,
          }
        )
      : new HappyMishap(`Problem converting "${getNodeType(node)}" to HTML!`, {
          name: "toHTML(getNodeType(node))",
          inspect: node,
          error: error_,
        });
    throw error;
  }
}

/**
 * Clones most DOM types
 */
export function clone<T extends Container | HTML>(container: T): T {
  const clone = solveForNodeType()
    .mirror()
    .solver({
      html: (h) => `${h}`,
      fragment: flow(toHtml, createFragment),
      document: (d) => {
        return createDocument(d.body.innerHTML, d.head.innerHTML);
      },
      element: (e) => pipe(e, toHtml, createElement),
      node: (n) => {
        throw new HappyMishap("Can't clone an unknown node!", { inspect: n });
      },
      text: flow(toHtml, createTextNode),
      comment: flow(toHtml, createCommentNode),
    });

  return clone(container);
}

/**
 * ensures that a given string doesn't have any HTML inside of it
 */
export function safeString(str: string): string {
  const node = createFragment(str);
  return node.textContent;
}
