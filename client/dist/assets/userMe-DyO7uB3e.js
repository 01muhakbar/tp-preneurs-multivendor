import{c}from"./createLucideIcon-agjozwnD.js";import{n as r}from"./index-Bzxu1Yu7.js";/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n=[["path",{d:"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z",key:"18u6gg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]],d=c("camera",n),s=a=>a?.data??a,m=async()=>{const{data:a}=await r.get("/user/me");return s(a)},p=async a=>{const t=new FormData;t.append("file",a);const{data:o}=await r.post("/upload",t,{headers:{"Content-Type":"multipart/form-data"}}),e=String(o?.data?.url||"").trim();if(!e)throw new Error("Upload succeeded without URL.");return e};export{d as C,m as g,p as u};
