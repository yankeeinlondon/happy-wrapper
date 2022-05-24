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
