import { isString } from "inferred-types";
import { 
  DomSource, 
  IElement, 
  IFragment, 
  MapContainerType, 
  createDocument, 
  createElement,  
  createFragment,  
  isDocument,  
  isElement, 
  isHtmlElement, 
  isNodeList 
} from "./index";

/**
 * **hasSelector**`(source, sel)`
 * 
 * Tests whether a given DOM selector is found in the DOM source passed in.
 */
export const hasSelector = <T extends DomSource>(source: T, sel: string): boolean => {
  let container: MapContainerType<T>;
  if (typeof source === "string") {
    if (source.includes("<html>")) {
      container = createDocument(source) as MapContainerType<T>;
    } else {
      container = createFragment(source) as MapContainerType<T>;
    }
  } else if (isDocument(source)) {
    container = source.body as MapContainerType<T>;
  } else if (isElement(source)) {
    container = source as IElement as MapContainerType<T>;
  } else {
    container = source as IFragment as MapContainerType<T>
  }

  const result = container.querySelector(sel);

  return result ? true : false;
} 


/**
 * **traverseUpward**`(el, sel)`
 * 
 * Traverses up the DOM until it _matches_ the selector. If no match is found
 * a `DomError` will be thrown and the `element` property will have the element
 * this traversal from, the `selector` property will have the selector.
 */
export const traverseUpward =  <
  T extends IElement | HTMLElement | string
>(node: T, sel: string): IElement => {
  let el: IElement | undefined = isElement(node)
    ? node
    : isString(node)
    ? createElement(node)
    : undefined;
  
  if(!el) {
    throw new Error (`Unexpected node passed into traverseUpward: ${typeof node}`);
  }

	while(el.parentElement && !el.parentElement.matches(sel)) {
		el = el.parentElement as unknown as IElement;
	}
	if(el?.parentElement?.matches(sel)) {
		return el.parentElement as IElement;
	} else {
		const err = new Error(`Failed to find parent node of selector "${sel}" using traverseUpward() utility!`) as Error & { 
      element: HTMLElement,
      selector: string
    };
		err.name = "DomError";
		err.element = el;
    err.selector = sel;
		throw err;
	}
}

/**
 * **peers**`(el, sel)`
 * 
 * Searches the elements peers using the passed in selector. If no match is found
 * a `DomError` will be thrown and the `element` property will have the element
 * this traversal from, the `selector` property will have the selector.
 */
export const peers = <T extends IElement | NodeList | string>(input: T, sel: string): IElement => {
  if (typeof input === "string") {
    return peers(createElement(input), sel) as IElement;
  }

  if(isNodeList(input)) {
    input.forEach(el => {
      if(isElement(el) && el.matches(sel)) {
        return el
      }
    });

    const err = new Error(`Failed to find a peer node matching "${sel}" using peers() utility over a NodeList!`) as Error & { 
      element: IElement | NodeList,
      selector: string
    };
    err.name = "DomError";
    err.selector = sel;
    err.element = input
    throw err;
  }

  if (isHtmlElement(input)) {
    let el: IElement = input as IElement;
    while(isElement(el?.nextElementSibling) && !el?.nextElementSibling?.matches(sel)) {
      el = el.nextElementSibling as IElement;
    }
    if(el.nextElementSibling?.matches(sel)) {
      return el.nextElementSibling as IElement;
    } else {
      const err = new Error(`Failed to find a peer node matching "${sel}" using peers() utility!`) as Error & { 
        element: IElement,
        selector: string
      };
      err.name = "DomError";
      err.element = el;
      err.selector = sel;
      throw err;		
    }
  }

  throw new Error(`Unknown input type [${typeof input}] provided to peers()!`)

}

