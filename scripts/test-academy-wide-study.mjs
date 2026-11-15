import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const script=readFileSync(new URL("../academy-coursebook-classic-v4.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../academy-coursebook-classic-v4.css",import.meta.url),"utf8");
const html=readFileSync(new URL("../academy-coursebook.html",import.meta.url),"utf8");
assert.match(css,/html\[data-reading-width="wide"\] \.grid/);
assert.match(css,/html\[data-reading-width="wide"\] \.sidebar #mobileModuleJump/);
assert.match(css,/@media \(max-width:980px\)/);
assert.match(css,/\.reader-width-toggle \{display:none!important\}/);
assert.match(html,/academy-coursebook-classic-v4\.css\?v=20261115-wide-study/);
assert.match(html,/academy-coursebook-classic-v4\.js\?v=20261115-wide-study/);

function mockNode(tag="div") {
 const node={tag,children:[],attrs:{},listeners:{},
  appendChild(child){this.children.push(child);},
  append(...children){this.children.push(...children);},
  prepend(child){this.children.unshift(child);},
  setAttribute(key,value){this.attrs[key]=value;},
  addEventListener(event,fn){this.listeners[event]=fn;},
  querySelectorAll(){return [];},
 };
 return node;
}
function boot(savedValue) {
 const sidebar=mockNode(), reading=mockNode(), controls=mockNode(), notice=mockNode();
 const objects={".gold-sidebar":sidebar,".quick-controls":controls,".notice-compact":notice};
 const stored=new Map(savedValue?[["agsa.coursebook.wideReading.v1",savedValue]]:[]);
 const doc={
  readyState:"complete",documentElement:{dataset:{}},
  querySelector(sel){return objects[sel]??null;},
  getElementById(id){return id==="lessonReading"?reading:id==="moduleList"?mockNode():null;},
  createElement:mockNode,
  addEventListener(){},
 };
 const context={document:doc,location:{href:"https://example.test/academy-coursebook.html?module=meteorology"},
  URL,localStorage:{getItem:key=>stored.get(key)??null,setItem:(key,val)=>stored.set(key,val)},
  queueMicrotask};
 runInNewContext(script,context,{timeout:1000});
 const toggle=sidebar.children[0];
 assert.equal(toggle.className,"reader-width-toggle");
 assert.equal(toggle.type,"button");
 return {doc,stored,toggle,sidebar};
}
const first=boot();
assert.equal(first.toggle.attrs["aria-pressed"],"false");
assert.equal(first.toggle.textContent,"Focus reading");
first.toggle.listeners.click();
assert.equal(first.doc.documentElement.dataset.readingWidth,"wide");
assert.equal(first.toggle.attrs["aria-pressed"],"true");
assert.equal(first.toggle.textContent,"Show course list");
assert.equal(first.stored.get("agsa.coursebook.wideReading.v1"),"wide");
const second=boot("wide");
assert.equal(second.doc.documentElement.dataset.readingWidth,"wide","Stored user choice should restore");
second.toggle.listeners.click();
assert.equal(second.doc.documentElement.dataset.readingWidth,"normal");
assert.equal(second.stored.get("agsa.coursebook.wideReading.v1"),"normal");
console.log("Academy wide reading: reversible control, keyboard-ready button, persisted setting and responsive selector passed.");
