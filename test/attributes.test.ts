import { pipe } from "fp-ts/lib/function";
import { describe, expect, it } from "vitest";
import {
  addClass,
  addVueEvent,
  clone,
  createDocument,
  createElement,
  createFragment,
  filterClasses,
  getClassList,
  removeClass,
  setAttribute,
  toHtml,
} from "../src";

describe("attributes", () => {
  it("setAttribute() utility", () => {
    const html = "<span>foo</span>";
    const frag = createFragment("<span>foo</span>");
    const setFoo = setAttribute("class")("foo");
    setFoo(frag);
    const html2 = setFoo(html);

    expect(toHtml(frag)).toBe('<span class="foo">foo</span>');
    expect(toHtml(html2)).toBe('<span class="foo">foo</span>');
  });

  const addOne = addClass("one");
  const addTwo = addClass("two");

  it("addClass() utility is able to add a class to the top-most node in Document", () => {
    const html = '<div class="foobar">testing</div>';
    const doc = createDocument(html);
    const plusOne = pipe(doc, addOne);
    const plusTwo = pipe(clone(plusOne), addTwo);

    expect(
      pipe(plusOne, getClassList),
      `Class list from Frag input is: ${pipe(plusOne, getClassList)}`
    ).length(2);
    expect(pipe(plusOne, getClassList)).contains("one");
    expect(pipe(plusOne, getClassList)).not.contains("two");

    expect(pipe(plusTwo, getClassList)).length(3);
    expect(pipe(plusTwo, getClassList)).contains("one");
    expect(pipe(plusTwo, getClassList)).contains("two");
  });

  it("addClass() utility is able to add a class to the top-most node in Fragment", () => {
    const html = '<div class="foobar">testing</div>';
    const frag = createFragment(html);
    const plusOne = pipe(frag, addOne);
    const plusTwo = pipe(clone(plusOne), addTwo);

    expect(
      pipe(plusOne, getClassList),
      `Class list from Frag input is: ${pipe(plusOne, getClassList)}`
    ).length(2);
    expect(pipe(plusOne, getClassList)).contains("one");
    expect(pipe(plusOne, getClassList)).not.contains("two");

    expect(pipe(plusTwo, getClassList)).length(3);
    expect(pipe(plusTwo, getClassList)).contains("one");
    expect(pipe(plusTwo, getClassList)).contains("two");
  });

  it("addClass() utility is able to add a class to the top-most node in an IElement", () => {
    const html = '<div class="foobar">testing</div>';
    const el = createElement(html);
    const plusOne = pipe(el, addOne);
    const plusTwo = pipe(clone(plusOne), addTwo);

    expect(pipe(plusOne, getClassList)).length(2);
    expect(pipe(plusOne, getClassList)).contains("one");
    expect(pipe(plusOne, getClassList)).not.contains("two");

    expect(pipe(plusTwo, getClassList)).length(3);
    expect(pipe(plusTwo, getClassList)).contains("one");
    expect(pipe(plusTwo, getClassList)).contains("two");
  });

  it("removeClass() utility removes classes from DOM tree", () => {
    const starting = createFragment('<div class="foobar">testing</div>');
    const removeFoobar = removeClass("foobar");
    const removeOne = removeClass("one");

    const stillStanding = pipe(starting, removeOne);
    const empty = pipe(clone(stillStanding), removeFoobar);

    expect(pipe(stillStanding, getClassList)).toContain("foobar");
    expect(pipe(empty, getClassList)).lengthOf(0);
  });

  it("filterClasses() utility removes classes and optionally can pass in a callback", () => {
    const el = '<span class="foo bar baz color-1 color-2 color-3">text</span>';
    const noFoo = pipe(el, createElement, filterClasses("foo"), toHtml);
    expect(noFoo).toBe(
      '<span class="bar baz color-1 color-2 color-3">text</span>'
    );

    let removed: string[] = [];
    const fancyRemoval = pipe(
      el,
      createElement,
      filterClasses(
        (r) => {
          removed = r;
        },
        "foo",
        "bar",
        /color-/
      ),
      toHtml
    );

    expect(fancyRemoval).toBe('<span class="baz">text</span>');
    expect(removed).toContain("foo");
    expect(removed).toContain("bar");
    expect(removed).toContain("color-1");
    expect(removed).toContain("color-2");
    expect(removed).toContain("color-3");
  });

  it("addVueEvent() adds an appropriate v-bind attribute", () => {
    const html = "<my-component>hello world</my-component>";
    const eventful = addVueEvent("onClick", "doit()")(html);
    expect(eventful, eventful).toContain('v-bind="{');
    expect(eventful, eventful).toContain("doit()");

    const el = createElement(html);
    const eventful2 = addVueEvent("onClick", "doit()")(el);
    expect(toHtml(eventful2), toHtml(eventful2)).toContain('v-bind="{');
    expect(toHtml(eventful2), toHtml(eventful2)).toContain("doit()");
  });
});
