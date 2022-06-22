import { pipe } from "fp-ts/es6/function";
import { describe, expect, it } from "vitest";
import {
  after,
  before,
  changeTagName,
  clone,
  createElement,
  createFragment,
  getChildren,
  getClassList,
  getNodeType,
  hasParentElement,
  IElement,
  inspect,
  into,
  isHappyWrapperError,
  placeholder,
  replaceElement,
  select,
  toHtml,
  wrap,
} from "../src";

describe("nodes", () => {
  it("into() with multiple nodes injected", () => {
    const wrapper = '<div class="my-wrapper"></div>';
    const indent = "\n\t";
    const text = "hello";
    const element = "<span>world</span>";
    const closeout = "\n";
    const html = `${indent}${text}${element}${closeout}`;

    expect(
      into(wrapper)(indent, text, element, closeout),
      "HTML wrapper passed in returns HTML with children inside"
    ).toBe(`<div class="my-wrapper">${html}</div>`);

    expect(
      into(wrapper)([indent, text, element, closeout]),
      "Children can be passed as an array too with no change in behavior"
    ).toBe(`<div class="my-wrapper">${html}</div>`);
    // try as a fragment
    const f = into(createFragment(wrapper))(indent, text, element, closeout);
    expect(
      toHtml(f),
      `HTML wrapper passed in returns HTML with children inside, instead got:\n${inspect(
        f,
        true
      )}`
    ).toBe(`<div class="my-wrapper">${html}</div>`);
    // try as an IElement
    const el = into(createElement(wrapper))(indent, text, element, closeout);
    expect(
      toHtml(el),
      `HTML wrapper passed in returns HTML with children inside, instead got:\n${inspect(
        el,
        true
      )}`
    ).toBe(`<div class="my-wrapper">${html}</div>`);

    const emptyParent = into()(indent, text, element, closeout);
    expect(toHtml(emptyParent)).toBe(html);
    // first two text elements are folded into one
    expect(
      emptyParent.childNodes,
      `\nchild nodes were: ${getChildren(emptyParent)
        .map((c) => getNodeType(c))
        .join(", ")}\n`
    ).toHaveLength(3);

    expect(
      toHtml(into('<div class="wrapper">')(indent, text, element, closeout))
    ).toBe(`<div class="wrapper">${html}</div>`);
  });

  it("into() using with updateAll() utility is able to mutate tree correctly", () => {
    // NOTE: the issue we're testing for is that the selector passed to updateAll()
    // is an IElement which _should_ have a parent element that contains it. When
    // when we call into() we are changing the hierarchy so that the parent of the incoming
    // element must now point to the _new_ parent node and this parent node in turn will
    // point to the incoming node
    const html = createElement(
      '<div class="container"><span class="one item">one</span><span class="two item">two</span></div>'
    );
    const wrapEach = '<span class="wrap-each"></span>';
    const expectedOutcome =
      '<div class="container"><span class="wrap-each"><span class="one item">one</span></span><span class="wrap-each"><span class="two item">two</span></span></div>';
    const sel = select(html);
    const wrapper = into(wrapEach);
    const result = sel.updateAll(".item")(wrapper).toContainer();
    expect(toHtml(result)).toBe(expectedOutcome);
    expect(toHtml(html)).toBe(expectedOutcome);
    for (const i of select(html).findAll(".item")) {
      expect(hasParentElement(i)).toBeTruthy();
    }
  });

  it("wrap() works as expected", () => {
    const html = "<span>foobar</span>";
    const text = "foobar";
    const siblings = "<span>one</span><span>two</span><span>three</span>";
    const middling = "<span>one</span>two<span>three</span>";
    const wrapper = createFragment('<div class="wrapper" />');

    const wrapHtml = wrap(html);
    const w1 = wrapHtml(clone(wrapper));
    expect(toHtml(w1)).toBe(`<div class="wrapper">${html}</div>`);

    const w2 = wrap(text)(clone(wrapper));
    expect(toHtml(w2)).toBe(`<div class="wrapper">${text}</div>`);

    const w3 = wrap(siblings)(clone(wrapper));
    expect(toHtml(w3)).toBe(`<div class="wrapper">${siblings}</div>`);

    const w4 = wrap(middling)(clone(wrapper));
    expect(toHtml(w4)).toBe(`<div class="wrapper">${middling}</div>`);

    const wrapper2 =
      '<div class="wrapper"><span class="interior"></span></div>';
    const anotherElement = '<span class="another">another element</span>';
    const wrapped = select(wrapper2)
      .update(".interior")(wrap(anotherElement))
      .toContainer();
    expect(wrapped).toBe(
      '<div class="wrapper"><span class="interior"><span class="another">another element</span></span></div>'
    );
  });

  it("wrap() using with updateAll() utility is able to mutate tree correctly", () => {
    const html =
      '<div class="container"><span class="one item">one</span><span class="two item">two</span></div>';
    const wrapEach = '<span class="wrap-each"></span>';
    const expectedOutcome =
      '<div class="container"><span class="one item">one<span class="wrap-each"></span></span><span class="two item">two<span class="wrap-each"></span></span></div>';
    const sel = select(html);
    const wrapper = wrap(wrapEach);
    const result = sel.updateAll(".item")(wrapper).toContainer();
    expect(result).toBe(expectedOutcome);
  });

  it("before() allows a container to be injected before another container", async () => {
    const wrap = createElement('<div class="wrapper"></div>');
    const one = '<span class="item one">one</span>';
    const two = '<span class="item two">two</span>';
    const three = '<span class="item three">three</span>';
    const wrappedOneTwo = into(wrap)(one, two);
    // basic test with HTML
    const beforeTwo = before(two);
    const t1 = beforeTwo(one);
    expect(t1, "basic test with HTML").toBe(`${two}${one}`);
    // a fragment should work the same
    const One = createFragment(one);
    expect(One.parentElement).toBeFalsy();
    const t2 = before(two)(One);
    expect(toHtml(t2), "with a fragment").toBe(`${two}${one}`);

    // an element without a parent, however, has no _natural parent_
    // so it should throw an error in this case
    const el = createElement(one);
    try {
      before(two)(el);
      throw new Error("element should have thrown error");
    } catch (error) {
      expect(isHappyWrapperError(error)).toBeTruthy();
      if (isHappyWrapperError(error)) {
        expect(error.name).toContain("before");
      }
    }

    // intent is for: [one, three, two]
    const placed = select(wrappedOneTwo)
      .update(
        ".two",
        `did not find "two" class when using select [${getClassList(
          el
        )}] on:\n${toHtml(wrappedOneTwo)}`
      )((el) => {
        expect(getClassList(el)).toContain("two");
        // the element must have a parent to be able to run before()
        expect(el.parentNode).toBeTruthy();

        // put three _before_ two
        before(three)(el);
        // parent should now have three children total
        expect(
          el?.parentNode?.childNodes.length,
          `parent node was: ${inspect(el.parentNode, true)}`
        ).toBe(3);
        return el;
      })
      .toContainer();

    const items = select(placed).findAll(".item");
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toContain("one");
    expect(items[1].textContent).toContain("three");
    expect(items[2].textContent).toContain("two");
  });

  it("before() works in concert with select().updateAll()", () => {
    const html = "<div><span>one</span><span>two</span></div>";
    const injectBefore = before("<p>before</p>");
    const transformed = pipe(
      html,
      select,
      (s) => s.updateAll("span")(injectBefore),
      (s) => s.toContainer()
    );

    expect(transformed).toBe(
      "<div><p>before</p><span>one</span><p>before</p><span>two</span></div>"
    );

    const injectWithIndex = (el: IElement, idx: number) =>
      before(`<p>before ${idx}</p>`)(el);

    const transformed2 = pipe(
      html,
      select,
      (s) => s.updateAll("span")(injectWithIndex),
      (s) => s.toContainer()
    );

    expect(transformed2).toBe(
      "<div><p>before 0</p><span>one</span><p>before 1</p><span>two</span></div>"
    );
  });

  it("after() works as expected", () => {
    const one = '<span class="item one">one</span>';
    const two = '<span class="item two">two</span>';
    const t1 = after(two)(one);
    expect(t1).toBe(`${one}${two}`);
  });

  it("tag capitalization is lost in element", () => {
    expect(createElement("<MyComponent></MyComponent>").outerHTML).toBe(
      "<mycomponent></mycomponent>"
    );
  });

  it("placeholder() replaces a selector with a placeholder while retaining original externally", () => {
    const original: IElement[] = [];
    const html = `<div><span class="hi">hi</span><span></span><span class="hi">bye</span></div>`;
    const t = select(html)
      .updateAll(".hi")(placeholder(original))
      .toContainer();
    expect(original).toHaveLength(2);
    expect(t).toBe(
      `<div><placeholder class="hi"></placeholder><span></span><placeholder class="hi"></placeholder></div>`
    );
  });

  it("changeTag() utility works as expected with all container types", () => {
    const html = '<span class="foobar">hello world</span>';
    const toDiv = changeTagName("div");
    // html
    expect(toDiv(html)).toBe('<div class="foobar">hello world</div>');
    // element
    expect(toHtml(toDiv(createElement(html)))).toBe(
      '<div class="foobar">hello world</div>'
    );
    // fragment
    expect(toHtml(toDiv(createFragment(html)))).toBe(
      '<div class="foobar">hello world</div>'
    );
  });

  it("changeTag() can preserve parent node", () => {
    const toDiv = changeTagName("div");
    expect(toDiv('<span class="child">hello world</span>')).toBe(
      '<div class="child">hello world</div>'
    );

    const html =
      '<div class="parent"><span class="child">hello world</span></div>';
    const updated = select(html).updateAll(".child")(toDiv).toContainer();
    expect(updated).toBe(
      '<div class="parent"><div class="child">hello world</div></div>'
    );

    const node = createElement(html);
    const child = select(node).findFirst(
      ".child",
      "did not find child selector!"
    );
    toDiv(child);
    expect(toHtml(node)).toBe(
      '<div class="parent"><div class="child">hello world</div></div>'
    );
  });

  it("changeTag() works with select().update()", () => {
    const html = '<div><span class="inside">inside</span></div>';
    const toTable = changeTagName("table");
    const converted = select(html).update()(toTable).toContainer();
    expect(converted).toBe('<table><span class="inside">inside</span></table>');

    const toTR = changeTagName("tr");
    const converted2 = pipe(
      html,
      select,
      (s) => s.update()(toTable),
      (s) => s.updateAll("span")(toTR),
      (s) => s.toContainer()
    );
    expect(converted2).toBe('<table><tr class="inside">inside</tr></table>');
  });

  it("replaceElement() replaces an element while preserving parental relationship", () => {
    const html =
      '<div class="parent"><span class="child">hello world</span></div>';
    const onlySpan = html.replace(/div/g, "span");
    const onlyDiv = html.replace(/span/g, "div");
    const outside = replaceElement(createElement(onlySpan))(
      createElement(html)
    );
    // basic replacement where parent is not defined
    expect(toHtml(outside), onlySpan);

    // passing in the node during updateAll replaces the node
    const parent = createElement(html);
    const updated = select(parent)
      .updateAll(".child")(
        replaceElement('<div class="child">hello world</div>')
      )
      .toContainer();
    expect(toHtml(updated)).toBe(onlyDiv);

    // pulling out a node with a query and updated externally still
    // produces mutation on parent node
    const parent2 = createElement(html);
    const child = select(parent2).findFirst(
      ".child",
      "did not find child element!"
    );
    replaceElement('<div class="child">hello world</div>')(child);
    expect(toHtml(parent2)).toBe(onlyDiv);
  });
});
