import { describe, expect, it } from "vitest";
import { changeTagName, createElement, createFragment, select, toHtml } from "../src";

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
    const updated = select(html)
      .updateAll(".line")(toDiv)
      .toContainer();
    const found = select(updated).findAll(".line");

    expect(found).toHaveLength(3);
    const tags = found.map(f => f.tagName.toLowerCase());
    for (const t of tags)  {expect(t).toBe("div");}
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

    const updated = selector
      .updateAll(".line")(toDiv)
      .toContainer();

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
});