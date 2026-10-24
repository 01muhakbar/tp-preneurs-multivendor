import{b as e}from"./index-BD_ieojo.js";const a=async t=>{const o=String(t||"").trim(),{data:n}=await e.get(`/store/customization/identity/${encodeURIComponent(o)}`);return n};export{a as g};
