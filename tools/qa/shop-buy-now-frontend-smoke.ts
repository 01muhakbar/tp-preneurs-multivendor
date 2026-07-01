import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../../client/src/pages/store/StoreShopPage2026.jsx", import.meta.url),
  "utf8"
);

assert.match(source, /onClick=\{handleAdd\}/, "cart icon must keep the Add to Cart action");
assert.match(source, /onClick=\{handleBuyNow\}/, "primary card CTA must use Buy Now action");
assert.match(source, /<span>\{isPurchasable \? "Buy Now"/, "primary card CTA label must be Buy Now");
assert.match(source, /if \(added\) navigate\("\/cart"\)/, "Buy Now must continue to the cart after a successful add");
assert.match(
  source,
  /productHasVariantSelections\(product\?\.variations\)/,
  "variant products must require option selection before cart navigation"
);

console.log("shop Buy Now frontend smoke: passed");
