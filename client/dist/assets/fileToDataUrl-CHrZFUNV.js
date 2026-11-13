import{c as t}from"./createLucideIcon-CkISMqqC.js";/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]],c=t("globe",i),n=new Set(["image/png","image/jpeg","image/webp"]),l=500*1024,d=e=>e?n.has(e.type)?e.size>l?{valid:!1,error:"Max 500KB"}:{valid:!0,error:""}:{valid:!1,error:"Only *.jpeg, *.webp and *.png images will be accepted"}:{valid:!1,error:"No file selected."},g=e=>new Promise((a,o)=>{const r=new FileReader;r.onload=()=>a(String(r.result||"")),r.onerror=()=>o(new Error("Failed to read image file.")),r.readAsDataURL(e)});export{c as G,g as f,d as v};
