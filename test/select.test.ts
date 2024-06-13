import { describe, expect, it } from "vitest";
import {
  changeTagName,
  createElement,
  createFragment,
  isElement,
  isHappyWrapperError,
  select,
  toHtml,
} from "../src";
import { Expect, Equal } from "@type-challenges/utils";

describe("select", () => {
  it("select() utility's updateAll functionality", () => {
    const html = `
    <div class='wrapper'>
      <span class='line line-1'>1</span>
      <span class='line line-2'>2</span>
      <span class='line line-3'>3</span>
    </div>
    `;
    const toDiv = changeTagName("div");
    const updated = select(html).updateAll(".line")(toDiv).toContainer();
    const found = select(updated).findAll(".line");

    expect(found).toHaveLength(3);
    const tags = found.map((f) => f.tagName.toLowerCase());
    for (const t of tags) {
      expect(t).toBe("div");
    }
  });

  it("select().mapAll(sel)(i => ...) is type strong", () => {
    const html = `<div class='wrapper'>
      <span class='line line-1'>1</span>
      <span class='line line-2'>2</span>
      <span class='line line-3'>3</span>
    </div>
    `;
    const el = createFragment(html);
    const selection = select(el).mapAll("span")((_m) => "foo" as const);
    type S = typeof selection;

    expect(Array.isArray(selection)).toBeTruthy();
    expect(selection.length).toBe(3);
    for (const s of selection) {
      expect(s).toBe("foo");
    }

    type cases = [
      Expect<Equal<S, "foo"[]>> //
    ];
    const cases: cases = [true];
  });

  it("can distinguish based on attribute being present or not", () => {
    const html = `
<script lang="ts" setup>
const sayHi = (name: string) => \`hi \${name}\`
</script>
<script>
const sayBye = (name) => "bye " + name
</script>
<script setup="">
const test = ref(1)
</script>
<script lang="ts">
const test1: string = "test"
</script>
<script lang="js">
const test2 = "test2"
</script>
    `;

    const ss = select(html).findAll("script[setup]");
    expect(ss).toHaveLength(2);
    const traditional = select(html).findAll("script:not([setup])");
    expect(traditional).toHaveLength(3);
  });

  it("update() and updateAll() utility works as expected", () => {
    const html = `
    <div class="wrapper">
      <span class="line line-1">1</span>
      <span class="line line-2">2</span>
      <span class="line line-3">3</span>
    </div>
    `;

    const toDiv = changeTagName("div");
    const toTable = changeTagName("table");
    const toTR = changeTagName("tr");
    const selector = select(html);

    const updated = selector.updateAll(".line")(toDiv).toContainer();

    expect(updated).toBe(html.replace(/span/g, "div"));

    const table = selector
      .update(".wrapper")(toTable)
      .updateAll(".line")(toTR)
      .toContainer();

    expect(table).toBe(`
    <table class="wrapper">
      <tr class="line line-1">1</tr>
      <tr class="line line-2">2</tr>
      <tr class="line line-3">3</tr>
    </table>
    `);

    // test other containers
    const updatedFrag = select(createFragment(html))
      .updateAll(".line")(toDiv)
      .toContainer();
    expect(toHtml(updatedFrag)).toBe(html.replace(/span/g, "div"));

    const updatedElement = select(createElement(html.trim()))
      .updateAll(".line")(toDiv)
      .toContainer();
    expect(toHtml(updatedElement)).toBe(html.trim().replace(/span/g, "div"));
  });

  it("select() utility's find functionality", () => {
    const html = '<span class="foo bar">foobar</span>';
    const frag = createFragment(html);
    const missing = select(frag).findFirst(".nonsense");
    const bunchANothing = select(frag).findAll(".nonsense");

    expect(missing).toBe(null);
    expect(bunchANothing).toHaveLength(0);
  });
  

  it("wrap() utility on an HTML selection works", () => {
    const html = '<span class="foo bar">foobar</span>';
    const wrapper = '<div class="wrapper">';
    const s = select(html).wrap(wrapper);

    expect(s.toContainer()).toBe(`${wrapper}${html}</div>`);
  });

  it("wrap() utility on an Element selection works", () => {
    const html = createElement('<span class="foo bar">foobar</span>');
    const wrapper = '<div class="wrapper">';
    const s = select(html).wrap(wrapper);

    expect(
      isElement(s.toContainer()),
      "when the selection is an element it should maintain it's type even if wrapper was an HTML string"
    ).toBeTruthy();

    expect(toHtml(s.toContainer())).toBe(`${wrapper}${html}</div>`);

    const s2 = select(html).wrap(createElement(wrapper));

    expect(
      isElement(s2.toContainer()),
      "when the selection is an element as well as the wrapper it should work the same as when getting an HTML wrapper"
    ).toBeTruthy();

    expect(toHtml(s2.toContainer())).toBe(`${wrapper}${html}</div>`);
  });

  it("when using wrap() utility but passing in a non-block element, error is produced", () => {
    const html = '<span class="foo bar">foobar</span>';
    const wrapper = "hello world";
    try {
      select(html).wrap(wrapper);
      throw new Error("An invalid wrapper should not be accepted");
    } catch (error) {
      expect(isHappyWrapperError(error)).toBeTruthy();
      if (isHappyWrapperError(error)) {
        expect(error.message).toContain("select.wrap()");
      }
    }

    try {
      select(html).wrap(wrapper, "end of days");
      throw new Error("An invalid wrapper should not be accepted");
    } catch (error) {
      expect(isHappyWrapperError(error)).toBeTruthy();
      if (isHappyWrapperError(error)) {
        expect(error.message).toContain("select.wrap()");
        expect(error.message).toContain("end of days");
      }
    }
  });
});
