import { expect, test } from 'vitest'
import { defineGrants, removeDuplicates } from '../src/helpers.js'
import type { Grants } from '../src/types.js'

test('defineGrants snapshot', () => {
  const code = `(function(){"use strict";function e(){const t=document.createElement("button");return t.textContent="Button",t.addEventListener("click",()=>{GM_notification({text:"Hello"})}),t}document.querySelector("div").appendChild(e()),console.log(GM_info),GM_addStyle("button{border:none;background-color:tomato;padding:1rem;font-size:1rem;font-weight:600;border-radius:1rem}")})();`
  const grants = defineGrants(code)
  expect(grants).toMatchSnapshot()
})

test('removeDuplicates snapshot', () => {
  const grants: Grants[] = [
    'GM_addElement',
    'GM_addElement',
    'GM_addStyle',
    'GM_download',
    'GM_addStyle'
  ]

  expect(removeDuplicates(grants)).toMatchSnapshot()
})

test('removeDuplicates insert string to array', () => {
  const str = 'hello'
  expect(removeDuplicates(str)).toEqual([str])
})
