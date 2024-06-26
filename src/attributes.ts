import { pipe } from "fp-ts/lib/function.js";
import type { IElement, INode } from "./index";
import type { Events } from "vue";
import type {
  Container,
  ContainerOrHtml,
  DocRoot,
  GetAttribute,
  HTML,
} from "./happy-types";
import { createElement, createFragment, createNode } from "./create";
import { HappyMishap } from "./errors";
import { isDocument, isElement, isFragment } from "./type-guards";
import { getNodeType, solveForNodeType, toHtml } from "./utils";

export type SetAttribute = (
  value: string
) => <N extends Container | HTML>(node: N) => N;


export type SetAttributeTo<_T extends string, _V extends string> = <
  N extends Container | HTML
>(
  node: N
) => N;

export const setAttribute =
  <T extends string>(attr: T): SetAttribute =>
  <V extends string>(value: V): SetAttributeTo<T, V> =>
  <N extends Container | HTML>(node: N): N => {
    const invalidNode = (n: INode) => {
      throw new HappyMishap(
        `You can not use the setAttribute() utility on a node of type: "${getNodeType(
          n
        )}"`,
        { name: `setAttribute(${attr})(${value})(INVALID)` }
      );
    };
    const result = solveForNodeType()
      .mirror()
      .solver({
        html: (h) =>
          pipe(h, createFragment, (f) => setAttribute(attr)(value)(f), toHtml),
        text: (t) => invalidNode(t),
        comment: (t) => invalidNode(t),
        node: (n) => invalidNode(n),
        fragment: (f) => {
          f.firstElementChild.setAttribute(attr, value);
          return f;
        },
        document: (d) => {
          d.body.firstElementChild.setAttribute(attr, value);
          return d;
        },
        element: (e) => {
          e.setAttribute(attr, value);
          return e;
        },
      })(node);

    return result;
  };

export const getAttribute = <T extends string>(attr: T): GetAttribute<T> => {
  return solveForNodeType("text", "node", "comment")
    .outputType<string>()
    .solver({
      html: (h) => pipe(h, createFragment, getAttribute(attr)),
      fragment: (f) => f.firstElementChild.getAttribute(attr),
      document: (doc) => doc.body.firstElementChild.getAttribute(attr),
      element: (el) => el.getAttribute(attr),
    });
};

const getClass = getAttribute("class");
const setClass = setAttribute("class");
/**
 * Provides the classes defined on a given container's top level
 * element as an array of strings
 */
export const getClassList = (container: Container | HTML | null): string[] => {
  if (!container) {
    return [];
  }

  return solveForNodeType()
    .outputType<string[]>()
    .solver({
      html: (h) => pipe(h, createFragment, getClassList),
      document: (d) => getClass(d.body.firstElementChild)?.split(/\s+/) || [],
      fragment: (f) => getClass(f.firstElementChild)?.split(/\s+/) || [],
      element: (e) => getClass(e)?.split(/\s+/) || [],
      text: (n) => {
        throw new HappyMishap("Passed in a text node to getClassList!", {
          name: "getClassList",
          inspect: n,
        });
      },
      comment: (n) => {
        throw new HappyMishap("Passed in a comment node to getClassList!", {
          name: "getClassList",
          inspect: n,
        });
      },
      node: (n) => {
        throw new HappyMishap(
          "Passed in an unknown node type to getClassList!",
          { name: "getClassList", inspect: n }
        );
      },
    })(container)
    .filter(Boolean);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type RemoveClass<R extends string | string[]> = <
  C extends DocRoot | IElement | HTML
>(
  container: C
) => C;

/**
 * Removes a class from the top level node of a container's body.
 *
 * Note: if the class wasn't present then no change is performed
 */
export const removeClass =
  <R extends string | string[]>(remove: R): RemoveClass<R> =>
  <D extends DocRoot | IElement | HTML>(doc: D): D => {
    const current = getClass(doc)?.split(/\s+/g) || [];
    const toRemove: string[] = Array.isArray(remove) ? remove : [remove];

    const resultantClassString = [
      ...new Set<string>(current.filter((c) => !toRemove.includes(c))),
    ]
      .filter(Boolean)
      .join(" ");

    return setClass(resultantClassString)(doc);
  };

 
export type AddClass = <
  C extends DocRoot | IElement | HTML
>(
  container: C
) => C;

/**
 * Adds a class to the top level node of a document's body.
 */
export const addClass =
  <A extends string[] | string[][]>(...add: A): AddClass =>
  <D extends DocRoot | IElement | HTML>(doc: D): D => {
    const toAdd = (Array.isArray(add) ? add.flat() : [add]) as string[];

    const currentClasses = getClass(doc)?.split(/\s+/g) || [];
    const resultantClasses = [
      ...new Set<string>([...currentClasses, ...toAdd]),
    ];

    return setClass(resultantClasses.join(" ").trim())(doc) as D;
  };

export const addVueEvent = (event: keyof Events, value: string) => {
  return <T extends IElement | HTML>(el: T): T => {
    const isHtml = typeof el === "string";
    const bound = getAttribute("v-bind")(isHtml ? createElement(el) : el);
    const bind = bound
      ? bound.replace("}", `, ${event}: '${value}' }`)
      : `{ ${event}: "${value}" }`;
    const e2 = setAttribute("v-bind")(bind)(el);

    return (isHtml ? toHtml(e2) : el) as T;
  };
};

export type Filter = string | RegExp;
export type FilterCallback = (removed: string[]) => void;
export type FiltersWithCallback = [FilterCallback, ...Filter[]];

function hasFilterCallback(
  filters: Filter[] | FiltersWithCallback
): filters is FiltersWithCallback {
  return typeof filters[0] === "function";
}

/**
 * Filters classes out from a given element using _filters_, where a filter:
 *
 * - string - when a string it will compare for a direct match
 * - RegExp - will run the RegExp's `test(class)` method
 *
 * Optionally you may pass in a callback function as the first parameter in the
 * the list and this callback will be then called with all filtered properties
 * passed to it. This is useful for creating desirable side-effects like _moving_
 * the classes to some other DOM element (for instance).
 */
export const filterClasses =
  <A extends Filter[] | [FilterCallback, ...Filter[]]>(...args: A) =>
  <D extends DocRoot | IElement | HTML>(doc: D): D => {
    const el =
      isDocument(doc) || isFragment(doc)
        ? (doc.firstElementChild as IElement)
        : isElement(doc)
        ? (doc as IElement)
        : null;
    if (!el) {
      throw new HappyMishap(
        "An invalid container was passed into filterClasses()!",
        { name: "filterClasses", inspect: doc }
      );
    }

    const filters = hasFilterCallback(args)
      ? (args.slice(1) as Filter[])
      : (args as Filter[]);
    const cb = hasFilterCallback(args) ? args[0] : undefined;
    const classes = getClassList(el);
    const removed: string[] = [];

    for (const klass of classes) {
      const matched = !filters.every((f) =>
        typeof f === "string" ? f.trim() !== klass.trim() : !f.test(klass)
      );
      if (matched) {
        removed.push(klass);
      }
    }

    setClass(classes.filter((k) => !removed.includes(k)).join(" "))(doc);

    if (cb) {
      cb(removed);
    }

    return doc;
  };

/**
 * Checks whether a given node has a parent reference
 */
export const hasParentElement = (node: ContainerOrHtml) => {
  const n = typeof node === "string" ? createNode(node) : node;
  return solveForNodeType()
    .outputType<boolean>()
    .solver({
      html: () => false,
      text: (t) => !!t.parentElement,
      comment: (t) => !!t.parentElement,
      element: (e) => !!e.parentElement,
      fragment: (f) => !!f.parentElement,
      document: () => true,
      node: (n) => !!n.parentElement,
    })(n);
};

/**
 * Get's the parent element of a given node or returns `null` if not
 * present.
 */
export const getParent = (node: ContainerOrHtml) => {
  return hasParentElement(node) ? (node as Container).parentElement : null;
};
