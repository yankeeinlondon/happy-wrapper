import { Equal, Expect } from "@type-challenges/utils";
import { describe, expect, it } from "vitest";
import { query } from "../src/query";
import { IElement } from "../src";

// Note: while type tests clearly fail visible inspection, they pass from Vitest
// standpoint so always be sure to run `tsc --noEmit` over your test files to 
// gain validation that no new type vulnerabilities have cropped up.

const html = `
<html>
<div id="title" class="title">To be or not to be</div>
<ul class="a-list-above-all-others">
  <li>one</li>
  <li>two</li>
  <li>three</li>
</ul>
<div class="topic">topic one</div>
<div class="topic">topic two</div>
<div class="topic">
  topic three
  <span class="foo bar">foobar</span>
</div>
</html>
`;


describe("query()", () => {

  it("happy path, throwing errors", () => {
    const one = query(html, "ul li", "throw");
    const list = query(html, "ul", "throw");

    expect(one.textContent).toBe("one");
    expect(list.children.length).toEqual(3);
    expect(() => query(html, "#not-here", "throw")).toThrowError(Error);

    
    type cases = [
      Expect<Equal<typeof one, IElement>>,
    ];
    const cases: cases = [
      true
    ];
  });

  
  it("happy path with empty object", () => {
    const one = query(html, "ul li");

    expect(one.textContent).toBe("one")
    
    type cases = [
      Expect<Equal<typeof one, (IElement | Record<string, undefined>)>>
    ];
    const cases: cases = [
      true
    ];
    
  });
  

});
