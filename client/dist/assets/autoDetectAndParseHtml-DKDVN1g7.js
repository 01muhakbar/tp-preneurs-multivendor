import{s as n}from"./sanitizeRichTextHtml-D-UUDeXS.js";const a=/<\/?(?:h[1-6]|p|strong|b|em|i|u|ul|ol|li|a|br|div|span|blockquote|hr|table|tr|td|th)\b/i,u=/&lt;\/?(?:h[1-6]|p|strong|b|em|i|u|ul|ol|li|a|br|div|span|blockquote|hr|table|tr|td|th)\b/i;function l(t){return!t||typeof t!="string"?!1:u.test(t)}function p(t){return!t||typeof t!="string"?!1:a.test(t)}function c(t){if(!t||typeof t!="string")return"";let e=t,i="",r=0;for(;e!==i&&r<5&&(i=e,e=e.replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&amp;/gi,"&"),r++,!!l(e)););return e}function f(t){if(t==null)return"";let e=String(t).trim();if(!e)return"";if(l(e)&&(e=c(e)),p(e))return n(e);const i=e.split(/\n{2,}/).map(r=>r.trim()).filter(Boolean);if(i.length>0){const r=i.map(o=>`<p>${o.replace(/\n/g,"<br/>")}</p>`).join("");return n(r)}return n(e)}function g(t){if(!t||typeof t!="string")return"";let e=f(t);return e=e.replace(/(<\/(?:h[1-6]|p|ul|ol|blockquote)>)/gi,`$1

`).replace(/(<\/li>)/gi,`$1
`).replace(/(<br\s*\/?>)/gi,`$1
`).replace(/\n{3,}/g,`

`).trim(),e}export{f as a,g as f,p as h,l as i};
