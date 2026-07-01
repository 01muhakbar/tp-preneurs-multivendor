const fs = require('fs');
const file = 'client/src/pages/seller/SellerStoreApplicationPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace META_KEYS
content = content.replace(
  /"legalEntity",\s*"pickupSameAsBusiness",\s*"pickupAddress",/,
  `"legalEntity",
  "email",
  "phone",
  "whatsapp",
  "websiteUrl",
  "instagramUrl",
  "tiktokUrl",
  "addressLine1",
  "addressLine2",
  "province",
  "city",
  "district",
  "postalCode",
  "country",`
);

// 2. Replace INITIAL_FORM
content = content.replace(
  /businessAddress: "",\s*pickupSameAsBusiness: true,\s*pickupAddress: "",/,
  `businessAddress: "",
  email: "",
  phone: "",
  whatsapp: "",
  websiteUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  addressLine1: "",
  addressLine2: "",
  province: "",
  city: "",
  district: "",
  postalCode: "",
  country: "Indonesia",`
);

// 3. applicationToForm update
content = content.replace(
  /businessAddress: address\.addressLine1 \|\| "",\s*\.\.\.metadata,/,
  `businessAddress: address.addressLine1 || "",
    email: metadata.email || "",
    phone: metadata.phone || "",
    whatsapp: metadata.whatsapp || "",
    websiteUrl: metadata.websiteUrl || "",
    instagramUrl: metadata.instagramUrl || "",
    tiktokUrl: metadata.tiktokUrl || "",
    addressLine1: metadata.addressLine1 || "",
    addressLine2: metadata.addressLine2 || "",
    province: metadata.province || "",
    city: metadata.city || "",
    district: metadata.district || "",
    postalCode: metadata.postalCode || "",
    country: metadata.country || "Indonesia",
    ...metadata,`
);

// 4. validateStep(0)
content = content.replace(
  /required\("description", "Short description"\);/,
  `required("description", "Short description");
    required("email", "Store Email");
    required("phone", "Store Phone");
    required("addressLine1", "Address Line 1");
    required("province", "Province");
    required("city", "City / Regency");
    required("district", "Subdistrict");
    required("postalCode", "Postal Code");`
);

// 5. validateStep(2)
content = content.replace(
  /if \(\!form\.pickupSameAsBusiness\) required\("pickupAddress", "Pickup address"\);\s*/,
  ""
);

// 6. renderStep(0)
const step0OldStart = `<div className="ssa-form-grid ssa-form-grid--two">`;
const step0OldEnd = `</>`;
// This time we slice the content from `if (step === 0)` up to the first `}` after `</>`
// to make sure we don't wipe out step 1.
let step0Idx = content.indexOf('if (step === 0) {');
if (step0Idx > -1) {
  // ensure we find it inside renderStep! 
  // It is the second occurrence of `if (step === 0) {`.
  let firstIdx = content.indexOf('if (step === 0) {');
  let secondIdx = content.indexOf('if (step === 0) {', firstIdx + 1);
  if (secondIdx > -1) {
    let nextStepIdx = content.indexOf('if (step === 1) {', secondIdx);
    if (nextStepIdx > -1) {
      // Extract the exact block of step 0 rendering
      let oldBlock = content.substring(secondIdx, nextStepIdx);
      
      const newStep0Content = `if (step === 0) {
      return (
        <>
          <div className="ssa-form-grid ssa-form-grid--two">
            <Field label="Store Name" name="storeName" value={form.storeName} error={errors.storeName} required placeholder="Enter your store name" autoComplete="organization" {...common} />
            <Field label="Store Slug" name="storeSlug" value={form.storeSlug} error={errors.storeSlug} required placeholder="your-store-slug" hint="This becomes your store's unique URL." {...common} />
            <Field label="Business Category" name="category" value={form.category} error={errors.category} required as="select" options={["Fashion & Apparel", "Food & Beverage", "Beauty & Personal Care", "Home & Living", "Electronics", "Services", "Other"]} {...common} />
            <Field label="Short Description" name="description" value={form.description} error={errors.description} required as="textarea" maxLength={200} placeholder="Describe your store, products, and what makes your brand special." hint={\`\${text(form.description).length} / 200 characters\`} {...common} />
          </div>
          
          <h3 style={{ marginTop: 24, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><Headphones size={18} /> Contact & Social Media</h3>
          <div className="ssa-form-grid ssa-form-grid--two">
            <Field label="Store Email" name="email" value={form.email} error={errors.email} required type="email" {...common} />
            <Field label="Phone" name="phone" value={form.phone} error={errors.phone} required {...common} />
            <Field label="WhatsApp" name="whatsapp" value={form.whatsapp} error={errors.whatsapp} {...common} />
            <Field label="Website URL" name="websiteUrl" value={form.websiteUrl} error={errors.websiteUrl} type="url" {...common} />
            <Field label="Instagram URL" name="instagramUrl" value={form.instagramUrl} error={errors.instagramUrl} type="url" {...common} />
            <Field label="TikTok URL" name="tiktokUrl" value={form.tiktokUrl} error={errors.tiktokUrl} type="url" {...common} />
          </div>

          <h3 style={{ marginTop: 24, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={18} /> Public Store Address</h3>
          <div className="ssa-form-grid ssa-form-grid--two">
            <Field label="Address Line 1" name="addressLine1" value={form.addressLine1} error={errors.addressLine1} required {...common} />
            <Field label="Address Line 2" name="addressLine2" value={form.addressLine2} error={errors.addressLine2} placeholder="Optional" {...common} />
            
            <Field label="Province" name="province" value={form.province} error={errors.province} required as="select" options={getProvinceOptions(form.province)} placeholder="Select Province" onChange={(name, value) => {
              common.onChange("province", value);
              common.onChange("city", "");
              common.onChange("district", "");
            }} disabled={!isEditable} />
            <Field label="City/Regency" name="city" value={form.city} error={errors.city} required as="select" options={getCityOptions(form.province, form.city)} placeholder={form.province ? "Select City/Regency" : "Select Province first"} onChange={(name, value) => {
              common.onChange("city", value);
              common.onChange("district", "");
            }} disabled={!isEditable || !form.province} />
            
            <Field label="Subdistrict" name="district" value={form.district} error={errors.district} required as="select" options={getDistrictOptions(form.province, form.city, form.district)} placeholder={form.city ? "Select Subdistrict" : "Select City first"} {...common} disabled={!isEditable || !form.city} />
            <Field label="Postal Code" name="postalCode" value={form.postalCode} error={errors.postalCode} required inputMode="numeric" {...common} />
            <Field label="Country" name="country" value={form.country} error={errors.country} required {...common} />
          </div>

          <h3 style={{ marginTop: 24, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><ImagePlus size={18} /> Store Branding</h3>
          <div className="ssa-upload-grid">
            <UploadBox label="Store Logo" value={form.storeLogo} error={uploadErrors.storeLogo || errors.storeLogo} uploading={uploading.storeLogo} onUpload={(file) => uploadFile("storeLogo", file, { imageOnly: true })} disabled={!isEditable} imageOnly />
            <UploadBox label="Store Banner" value={form.storeBanner} error={uploadErrors.storeBanner} uploading={uploading.storeBanner} onUpload={(file) => uploadFile("storeBanner", file, { imageOnly: true })} disabled={!isEditable} optional wide imageOnly />
          </div>
        </>
      );
    }
    `;
      content = content.replace(oldBlock, newStep0Content);
    }
  }
}

// 7. renderStep(2)
// Remove the pickup section
const pickupSectionRegex = /<section className="ssa-form-section">\s*<h3><MapPin size=\{18\} \/> 2\. Pickup \/ Warehouse Address<\/h3>[\s\S]*?<\/section>/;
content = content.replace(pickupSectionRegex, "");
content = content.replace(/<h3><Clock3 size=\{18\} \/> 3\. Operating Hours<\/h3>/, '<h3><Clock3 size={18} /> 2. Operating Hours</h3>');
content = content.replace(/<h3><Store size=\{18\} \/> 4\. Shipping Setup<\/h3>/, '<h3><Store size={18} /> 3. Shipping Setup</h3>');

fs.writeFileSync(file, content);
console.log('Done');
