# happy-wrapper

A wrapper around the popular [happy-dom](https://github.com/capricorn86/happy-dom) API which provides a more _functional_ interaction model.

## Examples

### Attributes

1. Partially compose a tag change operation:

   ```ts
   const toDiv = ChangeTagName('div');
   const toTable = ChangeTagName('table');
   ```

   and then apply it later to HTML text, an IElement node, a doc fragment, etc.:

   ```ts
   // "<div>hello world</div>" 
   const html = toDiv("<span>hello world</span>");
   // IElement which wraps the HTML "<table>hello world</table>"
   const el = toTable(createElement("<span>hello world</span>"));
   ```

2. Change classes on an element:

    ```ts
    const html = "<span class='nada'>hello world</span>"
    // "<span class='foobar'>hello world</span>"
    const changed = pipe(
        html,
        addClass("foobar"),
        removeClass("nada")
    )
    ```

### Selections

- Select a node (or whole document):

    ```ts
    const html = "<html>...</html>";
    const sel = select(html);
    ```

- Query and return a node or node list

    ```ts
    // returns first H1 node or null if not found
    const h1: IElement | null = sel.findFirst('h1'); 
    // throw an error if not found
    const h1b: IElement = sel.findFirst("h1", "couldn't find the H1 selector");
    ```

- Iterate over a selector and mutate the selected nodes

    ```ts
    import { pipe } from "fp-ts/lib/function.js";
    return html.updateAll('h1')(el => 
        pipe(
            el,
            addClass("foobar"),
            changeTagName("h2"),
            wrap('<div class="was-h1">')
        )
    );
    ```

    > Note: you don't have to use a library like [fp-ts](https://github.com/gcanti/fp-ts) but because the exposed API surface is functional in many ways, utilities like pipe and flow can be quite handy.

## Documentation Via Typing

Formal documentation is not expected to every be much but we believe that strong typescript types are the way to express documentation that is both easier to maintain and easier to consume.

All available symbols are named exports and can be explored via symbol completion in your editor of choice. Further, an attempt has been made to provide rich types that describe and properly limit the scope of type so that you're use is hopefully understood and safe.

## Re-Exports

To avoid any small API variations that might exist in future `happy-dom` versions we do re-export the key symbols from that library. That includes:

- `IElement`, `IText`, and `INode`
- `Document`, and `DocumentFragment`

> **Note:** we actually _re_-export `DocumentFragment` as both `DocumentFragment` and as `Fragment`. We do this because the _type_ for `DocumentFragment` will be auto-associated to the browser's DOM if you don't explicitly state it and Happy DOM's implementation is a subset of the full DOM so you'll get typing errors that may seem baffling. To avoid this we prefer use of the short and explicit type of `Fragment`.

## Contributions

This library was built with a specific purpose in mind and therefore it's surface area may have some gaps in terms of addressing all obvious use-cases around the DOM. Happy to work with anyone who wants to add in a PR to make this a better subset.

## License

This library is made available for use under the MIT open source license.
