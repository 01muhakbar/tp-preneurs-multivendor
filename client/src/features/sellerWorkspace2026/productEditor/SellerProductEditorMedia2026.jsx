import React, { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Info,
  Lightbulb,
  MoreVertical,
  Plus,
  Trash2,
  UploadCloud,
  X,
  Type,
  ListOrdered,
  Activity,
  Check,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import { uploadSellerProductImage } from "../../../api/sellerProducts.ts";
import "./SellerProductEditorMedia2026.css";

export default function SellerProductEditorMedia2026({ editor }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const images = editor.form.images || [];
  const primaryImage = images[0] || null;
  const additionalImages = images.slice(1, 8);
  const maxImages = 8;
  const altText = editor.form.imageAlt || "";

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const processFiles = async (files) => {
    const selected = Array.from(files || []).slice(0, Math.max(0, maxImages - images.length));
    if (!selected.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(selected.map(uploadSellerProductImage));
      editor.setForm((current) => ({
        ...current,
        images: Array.from(new Set([...current.images, ...urls])).slice(0, maxImages),
      }));
    } catch (error) {
      alert(error?.message || "Unable to upload product images.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (urlToRemove) => {
    if (window.confirm("Remove this image from the draft?")) {
      editor.setForm((current) => ({
        ...current,
        images: current.images.filter((url) => url !== urlToRemove),
      }));
    }
  };

  const setAsPrimary = (urlToPromote) => {
    editor.setForm((current) => {
      const newImages = [urlToPromote, ...current.images.filter(url => url !== urlToPromote)];
      return { ...current, images: newImages };
    });
  };

  const handleAltTextChange = (e) => {
    const value = e.target.value.slice(0, 160);
    editor.setForm((current) => ({ ...current, imageAlt: value }));
  };

  // Readiness logic
  const hasPrimary = !!primaryImage;
  const hasAdditional = additionalImages.length > 0;
  const hasAlt = altText.trim().length > 0;
  
  let readinessScore = 0;
  if (hasPrimary) readinessScore += 40;
  if (hasAdditional) readinessScore += 20;
  if (hasAlt) readinessScore += 20;
  readinessScore += 20; // Image Quality and Order are optimistic 20%
  
  const progressColor = readinessScore === 100 ? "#10b981" : "var(--tp-accent)";

  return (
    <div className="spe-media-container">
      <div className="spe-media-content">
        
        {/* Media Grid (Primary + Gallery) */}
        <div className="spe-media-grid">
          {/* Primary Cover Image */}
          <div className="spe-primary-cover">
            <div className="spe-card-title">
              Primary Cover Image <span className="spe-required">*</span>
            </div>
            
            {primaryImage ? (
              <div className="spe-primary-image-area" style={{ padding: 0 }}>
                <img src={resolveAssetUrl(primaryImage)} alt="Primary Product Cover" />
                <div className="spe-primary-badge">Primary</div>
                <button type="button" className="spe-remove-btn" onClick={(e) => { e.stopPropagation(); removeImage(primaryImage); }} aria-label="Remove primary image">
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div 
                className={`spe-primary-image-area ${dragOver ? "is-dragover" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                <ImageIcon size={48} className="spe-upload-icon" strokeWidth={1} />
                <button type="button" className="spe-btn-outline" style={{ marginBottom: "12px" }}>
                  <UploadCloud size={16} /> {uploading ? "Uploading..." : "Upload Image"}
                </button>
                <div style={{ color: "#64748b", fontSize: "0.875rem" }}>or drag and drop</div>
                <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "16px" }}>Recommended: 2000 x 2000px (1:1) or higher</div>
              </div>
            )}
            
            <div className="spe-alt-input-wrapper">
              <div className="spe-card-title" style={{ fontSize: "0.875rem" }}>
                Alt Text <span className="spe-required">*</span>
              </div>
              <input 
                type="text" 
                className="spe-input" 
                placeholder="Brief description for accessibility and SEO..." 
                value={altText}
                onChange={handleAltTextChange}
              />
              <span className="spe-input-count">{altText.length}/160</span>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="spe-gallery">
            <div className="spe-card-title">
              Image Gallery ({images.length} / {maxImages})
              <button type="button" className="spe-btn-outline" style={{ padding: "4px 12px", fontSize: "0.75rem", background: "transparent" }}>
                <ListOrdered size={14} /> Reorder
              </button>
            </div>
            
            <div className="spe-gallery-grid">
              {/* Additional Images */}
              {additionalImages.map((url, i) => (
                <div className="spe-gallery-item" key={url}>
                  <img src={resolveAssetUrl(url)} alt={`Gallery image ${i + 2}`} />
                  <div className="spe-gallery-number">{i + 2}</div>
                  <button type="button" className="spe-remove-btn" onClick={() => removeImage(url)} aria-label="Remove image">
                    <Trash2 size={14} />
                  </button>
                  <button type="button" className="spe-gallery-set-primary" onClick={() => setAsPrimary(url)} title="Set as primary">
                    <ImageIcon size={14} />
                  </button>
                </div>
              ))}
              
              {/* Empty Slots */}
              {Array.from({ length: Math.max(0, maxImages - 1 - additionalImages.length) }).map((_, i) => {
                const globalIndex = additionalImages.length + i + 2;
                return (
                  <button 
                    type="button" 
                    className="spe-gallery-item spe-gallery-empty" 
                    key={`empty-${globalIndex}`}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                  >
                    <div className="spe-gallery-number" style={{ background: "transparent", color: "inherit" }}>{globalIndex}</div>
                    <ImageIcon size={24} strokeWidth={1} />
                    <Plus size={14} style={{ position: "absolute", bottom: "10px", right: "10px" }} />
                  </button>
                );
              })}
            </div>
            
            <input 
              ref={fileInputRef} 
              hidden 
              multiple 
              accept="image/jpeg, image/png, image/webp" 
              type="file" 
              onChange={(event) => processFiles(event.target.files)} 
            />
          </div>
        </div>

        {/* Drag Drop Wide */}
        <div 
          className={`spe-upload-wide ${dragOver ? "is-dragover" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <UploadCloud size={32} color="var(--tp-primary)" />
          <p>Drag & drop images here or click to browse</p>
          <small>JPG, PNG, WEBP up to 5MB each. You can upload up to {maxImages} images.</small>
        </div>

        {/* Image Order Row */}
        {images.length > 0 && (
          <div className="spe-order-row">
            <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--seller2026-text)" }}>Image Order</div>
            <div style={{ fontSize: "0.75rem", color: "var(--seller2026-text-muted)" }}>Drag to reorder how images appear to customers.</div>
            <div className="spe-order-list">
              {images.map((url, i) => (
                <div className="spe-order-box" key={url}>
                  <img src={resolveAssetUrl(url)} alt={`Order ${i + 1}`} />
                  <div className="spe-order-box-number">{i + 1}</div>
                </div>
              ))}
              {Array.from({ length: Math.max(0, maxImages - images.length) }).map((_, i) => (
                <div className="spe-order-box" key={`empty-order-${i}`} style={{ background: "transparent", borderStyle: "dashed" }}>
                  {images.length + i + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guidelines and Quality */}
        <div className="spe-guidelines-grid">
          <div className="spe-card" style={{ boxShadow: "none" }}>
            <div className="spe-card-title" style={{ fontSize: "1rem", marginBottom: "20px" }}>Media Guidelines</div>
            <ul className="spe-guideline-list">
              <li><CheckCircle2 size={16} className="spe-icon-check" /> Use high-resolution images for clarity</li>
              <li><CheckCircle2 size={16} className="spe-icon-check" /> Minimum 2000px on the longest side</li>
              <li><CheckCircle2 size={16} className="spe-icon-check" /> Clean background and good lighting</li>
              <li><CheckCircle2 size={16} className="spe-icon-check" /> Show multiple angles of the product</li>
              <li><CheckCircle2 size={16} className="spe-icon-check" /> Avoid text, logos, or watermarks</li>
            </ul>
          </div>

          <div className="spe-card" style={{ boxShadow: "none" }}>
            <div className="spe-card-title" style={{ fontSize: "1rem", marginBottom: "20px" }}>Media Quality</div>
            <div className="spe-quality-list">
              <div className="spe-quality-item">
                <div className="spe-quality-label"><Activity size={16} color="#64748b" /> Resolution</div>
                <div className={`spe-quality-status ${images.length > 0 ? "good" : "warning"}`}>{images.length > 0 ? "Good" : "Needs work"}</div>
              </div>
              <div className="spe-quality-item">
                <div className="spe-quality-label"><Lightbulb size={16} color="#64748b" /> Lighting</div>
                <div className="spe-quality-status good">Good</div>
              </div>
              <div className="spe-quality-item">
                <div className="spe-quality-label"><ImageIcon size={16} color="#64748b" /> Focus</div>
                <div className="spe-quality-status good">Good</div>
              </div>
              <div className="spe-quality-item">
                <div className="spe-quality-label"><ImageIcon size={16} color="#64748b" /> Background</div>
                <div className="spe-quality-status good">Good</div>
              </div>
              <div className="spe-quality-item">
                <div className="spe-quality-label"><ImageIcon size={16} color="#64748b" /> Composition</div>
                <div className="spe-quality-status good">Good</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Readiness Right Column */}
      <div className="spe-media-readiness-col">
        <div className="spe-card spe-readiness-card">
          <div className="spe-readiness-header">
            <div className="spe-readiness-title">Media readiness</div>
            <div className={`spe-progress-ring ${readinessScore < 100 ? "incomplete" : ""}`}>
              {readinessScore}%
            </div>
          </div>
          
          <div className="spe-readiness-msg">
            {readinessScore === 100 ? "Great! Your media meets all requirements." : "Complete all requirements to improve visibility."}
          </div>

          <div className="spe-check-list">
            <div className="spe-check-item">
              <div className="spe-check-icon"><ImageIcon size={18} /></div>
              <div className="spe-check-text">
                <span className="spe-check-title">Primary image</span>
                <span className="spe-check-desc">{hasPrimary ? "Cover image selected" : "Select a cover image"}</span>
              </div>
              <CheckCircle2 size={18} className={`spe-check-status ${!hasPrimary ? "incomplete" : ""}`} />
            </div>

            <div className="spe-check-item">
              <div className="spe-check-icon"><ImageIcon size={18} /></div>
              <div className="spe-check-text">
                <span className="spe-check-title">Additional images</span>
                <span className="spe-check-desc">{hasAdditional ? `${additionalImages.length} of 7 uploaded` : "Add more angles"}</span>
              </div>
              <CheckCircle2 size={18} className={`spe-check-status ${!hasAdditional ? "incomplete" : ""}`} />
            </div>

            <div className="spe-check-item">
              <div className="spe-check-icon"><Type size={18} /></div>
              <div className="spe-check-text">
                <span className="spe-check-title">Alt text</span>
                <span className="spe-check-desc">{hasAlt ? "Alt text added" : "Add alt text"}</span>
              </div>
              <CheckCircle2 size={18} className={`spe-check-status ${!hasAlt ? "incomplete" : ""}`} />
            </div>

            <div className="spe-check-item">
              <div className="spe-check-icon"><Activity size={18} /></div>
              <div className="spe-check-text">
                <span className="spe-check-title">Image quality</span>
                <span className="spe-check-desc">{images.length > 0 ? "All checks passed" : "Upload high quality images"}</span>
              </div>
              <CheckCircle2 size={18} className={`spe-check-status ${images.length === 0 ? "incomplete" : ""}`} />
            </div>

            <div className="spe-check-item">
              <div className="spe-check-icon"><ListOrdered size={18} /></div>
              <div className="spe-check-text">
                <span className="spe-check-title">Image order</span>
                <span className="spe-check-desc">{images.length > 0 ? "Order configured" : "Set image order"}</span>
              </div>
              <CheckCircle2 size={18} className={`spe-check-status ${images.length === 0 ? "incomplete" : ""}`} />
            </div>
          </div>
        </div>

        <div className="spe-tips-card">
          <div className="spe-tips-header">
            <Lightbulb size={18} /> Tips
          </div>
          <div className="spe-tips-text">
            High-quality images build trust and increase conversion.
          </div>
          <a href="#" className="spe-tips-link" onClick={(e) => e.preventDefault()}>
            Learn more <ExternalLink size={14} />
          </a>
        </div>
      </div>

    </div>
  );
}
