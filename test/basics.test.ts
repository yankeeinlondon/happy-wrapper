import { describe, expect, it } from "vitest";
import { createDocument, createFragment, createTextNode, isElementLike, nodeBoundedByElements, nodeChildrenAllElements, toHtml } from "../src";

const tokenizedCode = `
<span class="line"><span class="token keyword">type</span> <span class="token class-name">Valid</span> <span class="token operator">=</span> <span class="token string">'foo'</span> <span class="token operator">|</span> <span class="token string">'bar'</span> <span class="token operator">|</span> <span class="token string">'baz'</span></span>
<span class="line"><span class="token keyword">const</span> testVariable<span class="token operator">:</span> Valid <span class="token operator">=</span> <span class="token string">'foo'</span></span>
<span class="line"><span class="token keyword">function</span> <span class="token function">myFunc</span><span class="token punctuation">(</span>name<span class="token operator">:</span> <span class="token builtin">string</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">return</span> <span class="token template-string"><span class="token template-punctuation string">\`</span><span class="token string">hello </span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">\${</span>name<span class="token interpolation-punctuation punctuation">}</span></span><span class="token template-punctuation string">\`</span></span></span>
<span class="line"><span class="token punctuation">}</span></span>
`;

const bareCode = `
type Valid = 'foo' | 'bar' | 'baz'
const testVariable: Valid = 'foo'
function myFunc(name: string) {
  return \`hello \${name}\`
}
`;

describe("Basics", () => {
  it("HTML remains unchanged when passed into and out of Document", () => {
    const d = createDocument(tokenizedCode);
    const d2 = createDocument(bareCode);
    const f = createFragment(tokenizedCode);
    const f2 = createFragment(bareCode);

    expect(toHtml(d.body.innerHTML)).toEqual(tokenizedCode);
    expect(toHtml(d2.body.innerHTML)).toEqual(bareCode);

    expect(toHtml(f)).toEqual(tokenizedCode);
    expect(toHtml(f2)).toEqual(bareCode);
  });

  it("HTML remains unchanged when passed into and out of Fragment", () => {
    const html1 = createFragment(tokenizedCode);
    const html2 = createFragment(bareCode);
    const html3 = createFragment("\n\t<span>foobar</span>\n");

    expect(toHtml(html1)).toEqual(tokenizedCode);
    expect(toHtml(html2)).toEqual(bareCode);
    expect(toHtml(html3)).toEqual("\n\t<span>foobar</span>\n");

    expect(toHtml(createFragment(bareCode))).toEqual(bareCode);
  });

  it("basics", () => {
    const open = '<div class="wrapper">';
    const html = "<span>foobar</span>";
    const frag = createFragment(html);
    const openFrag = createFragment(open);

    expect(isElementLike(frag)).toBeTruthy();
    expect(isElementLike(openFrag)).toBeTruthy();

    expect(toHtml(frag.firstElementChild)).toBe(html);
    expect(frag.textContent).toBe("foobar");
    expect(frag.childNodes.length, "HTML results in single child node").toBe(1);
    expect(frag.firstElementChild).not.toBeNull();
    expect(frag.firstElementChild).toBe(frag.lastElementChild);
    expect(frag.firstElementChild.tagName).toBe("SPAN");
    expect(frag.firstChild, "node and element are equivalent").toBe(frag.firstElementChild);

    const text = "hello world";
    const frag2 = createFragment(text);
    expect(frag2.textContent).toBe(text);
    expect(frag2.childNodes.length, "text node results in single child node").toBe(1);
    expect(frag2.childNodes[0].hasChildNodes()).toBeFalsy();
    expect(frag2.firstElementChild).toBeNull();
    expect(frag2.firstChild).not.toBeNull();
    expect(frag2.firstChild.textContent).toBe(text);

    const hybrid = "hello <span>world</span>";
    const frag3 = createFragment(hybrid);
    expect(frag3.textContent).toBe(text);
    expect(frag3.childNodes.length, "hybrid node results two child nodes").toBe(2);
    expect(frag3.firstElementChild, 'hybrid has a "first element"').not.toBeNull();
    expect(frag3.firstChild, "hybrid frag has a child").not.toBeNull();
    expect(frag3.firstChild.childNodes.length, "hybrid firstChild node has children").not.toBeNull();
    expect(frag3.lastChild).toBe(frag3.lastElementChild);
    frag3.prepend("\n");
    frag3.lastElementChild.append("\n");
    expect(frag3.textContent).toBe("\nhello world\n");

    const siblings = "<span>one</span><span>two</span><span>three</span>";
    const frag4 = createFragment(siblings);
    expect(frag4.textContent).toBe("onetwothree");
    expect(frag4.childNodes).toHaveLength(3);
    expect(frag4.firstElementChild.textContent).toBe("one");
    frag4.firstElementChild.prepend("\n");
    frag4.lastElementChild.append("\n");
    expect(frag4.textContent).toBe("\nonetwothree\n");
    expect(nodeBoundedByElements(frag4)).toBeTruthy();
    expect(nodeChildrenAllElements(frag4)).toBeTruthy();

    const middling = "<span>one</span>two<span>three</span>";
    const frag5 = createFragment(middling);
    expect(frag5.textContent).toBe("onetwothree");
    expect(frag5.childNodes).toHaveLength(3);
    expect(frag5.firstElementChild.textContent).toBe("one");
    frag5.firstElementChild.prepend("\n");
    frag5.lastElementChild.append("\n");
    expect(frag5.textContent).toBe("\nonetwothree\n");
    expect(nodeBoundedByElements(frag5)).toBeTruthy();
    expect(nodeChildrenAllElements(frag5)).toBeFalsy();

    const textNode = createTextNode("hello");
    expect(textNode.hasChildNodes()).toBeFalsy();
  });

});