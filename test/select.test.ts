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