import { IElement, createElement, isElement, isHtmlElement, isNodeList } from ".";


/**
 * **traverseUpward**`(el, sel)`
 * 
 * Traverses up the DOM until it _matches_ the selector. If no match is found
 * a `DomError` will be thrown and the `element` property will have the element
 * this traversal from, the `selector` property will have the selector.
 */
export const traverseUpward = (el: HTMLElement | string, sel: string): HTMLElement => {
  if (typeof el === "string") {
    return traverseUpward(createElement(el), sel);
  }
	while(el.parentElement && !el.parentElement.matches(sel)) {
		el = el.parentElement as HTMLElement;
	}
	if(el?.parentElement?.matches(sel)) {
		return el.parentElement as HTMLElement;
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
