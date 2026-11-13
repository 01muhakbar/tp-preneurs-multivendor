import { useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Award,
  BookOpen,
  Check,
  ChevronRight,
  Eye,
  HeartHandshake,
  Image as ImageIcon,
  Lightbulb,
  Monitor,
  Plus,
  RefreshCw,
  Rocket,
  RotateCcw,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  User,
  Users,
} from "lucide-react";
import StoreCustomizationTabNav2026 from "./StoreCustomizationTabNav2026.jsx";
import "./StoreCustomizationAboutUsSettings2026.css";

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const DEFAULT_MEMBERS = [
  {
    title: "Indah",
    subTitle: "TP Preneurs Developer & Tech Lead",
    imageDataUrl: "",
  },
  {
    title: "Muh. Akbar",
    subTitle: "System Architect & Fullstack Engineer",
    imageDataUrl: "",
  },
  {
    title: "Nurul",
    subTitle: "Creative Director & Multimedia Lead",
    imageDataUrl: "",
  },
  {
    title: "Satria",
    subTitle: "Product Specialist & Community Operations",
    imageDataUrl: "",
  },
  {
    title: "Fuad",
    subTitle: "UI/UX Designer & Learning Experience",
    imageDataUrl: "",
  },
  {
    title: "Prety",
    subTitle: "Business Strategy & Partnership Liaison",
    imageDataUrl: "",
  },
];

const normalizeAboutUsData = (source) => {
  const root = isPlainObject(source) ? source : {};

  const pageHeader = isPlainObject(root.pageHeader) ? root.pageHeader : {};
  const topContentLeft = isPlainObject(root.topContentLeft) ? root.topContentLeft : {};
  const topContentRight = isPlainObject(root.topContentRight) ? root.topContentRight : {};
  const contentSection = isPlainObject(root.contentSection) ? root.contentSection : {};
  const ourTeam = isPlainObject(root.ourTeam) ? root.ourTeam : {};

  const boxOne = isPlainObject(topContentLeft.boxOne) ? topContentLeft.boxOne : {};
  const boxTwo = isPlainObject(topContentLeft.boxTwo) ? topContentLeft.boxTwo : {};
  const boxThree = isPlainObject(topContentLeft.boxThree) ? topContentLeft.boxThree : {};

  const rawMembers = Array.isArray(ourTeam.members) ? ourTeam.members : [];
  const normalizedMembers = Array.from({ length: 6 }).map((_, idx) => {
    const fallback = DEFAULT_MEMBERS[idx];
    const cur = rawMembers[idx] || {};
    return {
      title: toText(cur.title, fallback.title),
      subTitle: toText(cur.subTitle ?? cur.subtitle, fallback.subTitle),
      imageDataUrl: toText(cur.imageDataUrl ?? cur.image, ""),
    };
  });

  return {
    ...root,
    pageHeader: {
      enabled: typeof pageHeader.enabled === "boolean" ? pageHeader.enabled : true,
      pageTitle: toText(pageHeader.pageTitle, "About TP Preneurs"),
      backgroundImageDataUrl: toText(pageHeader.backgroundImageDataUrl, ""),
    },
    topContentLeft: {
      enabled: typeof topContentLeft.enabled === "boolean" ? topContentLeft.enabled : true,
      topTitle: toText(
        topContentLeft.topTitle,
        "Turning learning challenges into EdTech opportunities"
      ),
      topDescription: toText(
        topContentLeft.topDescription,
        "Behind TP Preneur is a team driven by a shared passion: transforming challenges into valuable business opportunities. We come from diverse backgrounds and expertise, yet unite to create impactful work, build an inclusive entrepreneurial ecosystem, and inspire one another to keep growing."
      ),
      boxOne: {
        title: toText(boxOne.title, "Pedagogically Sound"),
        subtitle: toText(boxOne.subtitle, "Learning-first design"),
        description: toText(
          boxOne.description,
          "Every product begins with rigorous instructional analysis, user empathy, and measurable learning outcomes."
        ),
      },
      boxTwo: {
        title: toText(boxTwo.title, "Young EdTech Builders"),
        subtitle: toText(boxTwo.subtitle, "Student-led innovation"),
        description: toText(
          boxTwo.description,
          "Built by passionate education-technology creators who understand frontline academic and vocational needs."
        ),
      },
      boxThree: {
        title: toText(boxThree.title, "Innovation to Industry"),
        subtitle: toText(boxThree.subtitle, "Real-world scalability"),
        description: toText(
          boxThree.description,
          "Connecting classroom research with commercial standards, market reach, and sustainable growth."
        ),
      },
    },
    topContentRight: {
      enabled: typeof topContentRight.enabled === "boolean" ? topContentRight.enabled : true,
      imageDataUrl: toText(topContentRight.imageDataUrl, ""),
    },
    contentSection: {
      enabled: typeof contentSection.enabled === "boolean" ? contentSection.enabled : true,
      contentImageDataUrl: toText(contentSection.contentImageDataUrl, ""),
      firstParagraph: toText(
        contentSection.firstParagraph,
        "Our Vision is to become a center of innovation and entrepreneurship for Educational Technology students, producing high-quality, practical, and competitive digital learning media solutions for the community."
      ),
      secondParagraph: toText(
        contentSection.secondParagraph,
        "Our Mission is to nurture entrepreneurial mindsets, foster collaboration between academia and MSMEs, and deliver high-impact digital educational resources that empower learners everywhere."
      ),
    },
    ourTeam: {
      enabled: typeof ourTeam.enabled === "boolean" ? ourTeam.enabled : true,
      title: toText(ourTeam.title, "Our Team"),
      description: toText(
        ourTeam.description,
        "Get to know the TP Preneurs team who keep our work relevant, useful, and ready to grow."
      ),
      members: normalizedMembers,
    },
  };
};

function Switch({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      aria-label={ariaLabel}
      onClick={() => onChange?.(!checked)}
      className={`au26-toggle-btn ${checked ? "is-active" : "is-inactive"}`}
    >
      <span className="au26-toggle-knob" />
    </button>
  );
}

function ImageUploadDropzone({
  id,
  label,
  specNote,
  value,
  onChange,
  onRemove,
  isId,
}) {
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert(isId ? "Format file harus berupa gambar (JPG, PNG, WEBP)." : "Please select an image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(isId ? "Ukuran gambar maksimal 5MB." : "Image size must not exceed 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange?.(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {specNote ? (
          <span className="text-[11px] font-semibold text-slate-400">
            {specNote}
          </span>
        ) : null}
      </div>

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
          <img
            src={value}
            alt={label}
            className="max-h-48 w-full object-contain p-2"
          />
          <div className="flex items-center justify-between border-t border-slate-200 bg-white/90 p-2 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              {isId ? "Gambar Terunggah" : "Image Uploaded"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200"
              >
                {isId ? "Ganti" : "Change"}
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400"
              >
                {isId ? "Hapus" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="au26-upload-box"
        >
          <Upload className="h-6 w-6 text-[#034c85] dark:text-sky-400 mb-1" />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {isId ? "Klik atau seret gambar ke sini" : "Click or drag image here"}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            JPG, PNG, WEBP • Maks 5MB
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function StoreCustomizationAboutUsSettings2026({
  value,
  activeTab,
  onTabChange,
  onChange,
  onSave,
  onPublish,
  onReset,
  onPreview,
  isSaving,
  isPublishing,
  meta = {},
  isLoading = false,
}) {
  const { i18n } = useTranslation();
  const isId = Boolean(i18n.language?.toLowerCase().startsWith("id"));
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [activeMemberIdx, setActiveMemberIdx] = useState(0);

  const state = useMemo(() => normalizeAboutUsData(value), [value]);

  const emit = (patch) => {
    const next = { ...state, ...patch, status: "draft", publishStatus: "draft" };
    onChange?.(next);
  };

  const updatePageHeader = (patch) => {
    emit({ pageHeader: { ...state.pageHeader, ...patch } });
  };

  const updateTopContentLeft = (patch) => {
    emit({ topContentLeft: { ...state.topContentLeft, ...patch } });
  };

  const updateBox = (boxKey, patch) => {
    emit({
      topContentLeft: {
        ...state.topContentLeft,
        [boxKey]: { ...state.topContentLeft[boxKey], ...patch },
      },
    });
  };

  const updateTopContentRight = (patch) => {
    emit({ topContentRight: { ...state.topContentRight, ...patch } });
  };

  const updateContentSection = (patch) => {
    emit({ contentSection: { ...state.contentSection, ...patch } });
  };

  const updateOurTeam = (patch) => {
    emit({ ourTeam: { ...state.ourTeam, ...patch } });
  };

  const updateMember = (index, patch) => {
    const nextMembers = state.ourTeam.members.map((m, idx) =>
      idx === index ? { ...m, ...patch } : m
    );
    updateOurTeam({ members: nextMembers });
  };

  const published =
    state.status === "published" ||
    state.publishStatus === "published" ||
    meta?.status === "published";

  const activeMember = state.ourTeam.members[activeMemberIdx] || DEFAULT_MEMBERS[0];

  return (
    <div className="au26-container space-y-6 pb-20">
      {/* Top Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {isId ? "Kustomisasi Toko" : "Store Customizations"}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                published ? "au26-badge-navy" : "au26-badge-orange"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${published ? "bg-[#034c85]" : "bg-[#fe6f05]"}`}
              />
              {published ? (isId ? "Diterbitkan" : "Published") : isId ? "Draf" : "Draft"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {isId
              ? "Kelola cerita, 3 pilar nilai, visi-misi, dan profil tim pada halaman Tentang Kami."
              : "Configure story, core pillars, vision-mission, and team profiles on the About Us page."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
          >
            <Eye className="h-4 w-4 text-[#034c85]" />
            <span>{isId ? "Pratinjau Toko" : "Preview Storefront"}</span>
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <StoreCustomizationTabNav2026 activeTab={activeTab} onTabChange={onTabChange} />

      {/* Main Grid: Left Editor + Right Live Preview */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: Form Editor */}
        <div className="space-y-6">
          {/* Section 1: Page Header & Title */}
          <section className="au26-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-white/10">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isId ? "1. Header & Judul Halaman" : "1. Page Header & Title"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isId
                    ? "Judul banner paling atas pada halaman Tentang Kami."
                    : "Top banner title and optional background image."}
                </p>
              </div>
              <Switch
                checked={state.pageHeader.enabled}
                onChange={(enabled) => updatePageHeader({ enabled })}
                ariaLabel={isId ? "Aktifkan header halaman" : "Enable page header"}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isId ? "Judul Halaman (Page Title)" : "Page Title"}
                </label>
                <input
                  type="text"
                  value={state.pageHeader.pageTitle}
                  onChange={(e) => updatePageHeader({ pageTitle: e.target.value })}
                  placeholder="About TP Preneurs"
                  className="au26-input text-xs font-bold"
                />
              </div>

              <ImageUploadDropzone
                id="au-header-bg-input"
                label={isId ? "Latar Belakang Header (Opsional)" : "Header Background Image (Optional)"}
                specNote="1200×360 px"
                value={state.pageHeader.backgroundImageDataUrl}
                onChange={(url) => updatePageHeader({ backgroundImageDataUrl: url })}
                onRemove={() => updatePageHeader({ backgroundImageDataUrl: "" })}
                isId={isId}
              />
            </div>
          </section>

          {/* Section 2: Hero Story & 3 Pillars */}
          <section className="au26-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-white/10">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isId ? "2. Cerita Hero & 3 Pilar Utama" : "2. Hero Story & 3 Core Pillars"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isId
                    ? "Cerita pembuka TP Preneurs beserta 3 pilar nilai utama."
                    : "Opening brand story accompanied by 3 core pillars."}
                </p>
              </div>
              <Switch
                checked={state.topContentLeft.enabled}
                onChange={(enabled) => updateTopContentLeft({ enabled })}
                ariaLabel={isId ? "Aktifkan hero konten" : "Enable hero story"}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isId ? "Judul Cerita Hero" : "Hero Story Title"}
                </label>
                <input
                  type="text"
                  value={state.topContentLeft.topTitle}
                  onChange={(e) => updateTopContentLeft({ topTitle: e.target.value })}
                  className="au26-input text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isId ? "Deskripsi Cerita Hero" : "Hero Story Description"}
                </label>
                <textarea
                  value={state.topContentLeft.topDescription}
                  onChange={(e) => updateTopContentLeft({ topDescription: e.target.value })}
                  rows={3}
                  className="au26-textarea text-xs"
                />
              </div>

              {/* 3 Pillars Sub-cards */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isId ? "3 Pilar Nilai Utama:" : "3 Core Value Pillars:"}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { key: "boxOne", label: isId ? "Pilar 1" : "Pillar 1", defaultIcon: BookOpen },
                    { key: "boxTwo", label: isId ? "Pilar 2" : "Pillar 2", defaultIcon: Lightbulb },
                    { key: "boxThree", label: isId ? "Pilar 3" : "Pillar 3", defaultIcon: Award },
                  ].map((pillar) => {
                    const box = state.topContentLeft[pillar.key] || {};
                    const IconComp = pillar.defaultIcon;
                    return (
                      <div
                        key={pillar.key}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/5 dark:bg-slate-900/60 space-y-2"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-black text-[#034c85] dark:text-sky-400">
                          <IconComp className="h-3.5 w-3.5" />
                          <span>{pillar.label}</span>
                        </div>
                        <input
                          type="text"
                          value={box.title}
                          placeholder={isId ? "Judul..." : "Title..."}
                          onChange={(e) => updateBox(pillar.key, { title: e.target.value })}
                          className="au26-input text-xs font-bold py-1 px-2"
                        />
                        <input
                          type="text"
                          value={box.subtitle}
                          placeholder={isId ? "Subjudul..." : "Subtitle..."}
                          onChange={(e) => updateBox(pillar.key, { subtitle: e.target.value })}
                          className="au26-input text-[11px] py-1 px-2 text-[#fe6f05] font-semibold"
                        />
                        <textarea
                          value={box.description}
                          placeholder={isId ? "Penjelasan ringkas..." : "Short description..."}
                          onChange={(e) => updateBox(pillar.key, { description: e.target.value })}
                          rows={2}
                          className="au26-textarea text-[11px] py-1 px-2"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hero Visual Image (Right) */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isId ? "Ilustrasi Visual Hero (Sisi Kanan)" : "Hero Visual Illustration (Right Side)"}
                  </span>
                  <Switch
                    checked={state.topContentRight.enabled}
                    onChange={(enabled) => updateTopContentRight({ enabled })}
                    ariaLabel={isId ? "Aktifkan ilustrasi hero" : "Enable hero illustration"}
                  />
                </div>
                {state.topContentRight.enabled ? (
                  <ImageUploadDropzone
                    id="au-hero-visual-input"
                    label=""
                    specNote="600×500 px"
                    value={state.topContentRight.imageDataUrl}
                    onChange={(url) => updateTopContentRight({ imageDataUrl: url })}
                    onRemove={() => updateTopContentRight({ imageDataUrl: "" })}
                    isId={isId}
                  />
                ) : null}
              </div>
            </div>
          </section>

          {/* Section 3: Vision & Mission */}
          <section className="au26-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-white/10">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isId ? "3. Visi & Misi Perusahaan" : "3. Vision & Mission Statement"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isId
                    ? "Landasan visi dan misi TP Preneurs beserta foto dokumentasi."
                    : "Corporate vision and mission statement with showcase image."}
                </p>
              </div>
              <Switch
                checked={state.contentSection.enabled}
                onChange={(enabled) => updateContentSection({ enabled })}
                ariaLabel={isId ? "Aktifkan seksi visi misi" : "Enable vision mission"}
              />
            </div>

            <div className="space-y-4">
              <ImageUploadDropzone
                id="au-content-image-input"
                label={isId ? "Gambar Visi & Misi" : "Vision & Mission Image"}
                specNote="600×400 px"
                value={state.contentSection.contentImageDataUrl}
                onChange={(url) => updateContentSection({ contentImageDataUrl: url })}
                onRemove={() => updateContentSection({ contentImageDataUrl: "" })}
                isId={isId}
              />

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isId ? "Paragraf Visi (Vision)" : "Vision Paragraph"}
                </label>
                <textarea
                  value={state.contentSection.firstParagraph}
                  onChange={(e) => updateContentSection({ firstParagraph: e.target.value })}
                  rows={3}
                  className="au26-textarea text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isId ? "Paragraf Misi (Mission)" : "Mission Paragraph"}
                </label>
                <textarea
                  value={state.contentSection.secondParagraph}
                  onChange={(e) => updateContentSection({ secondParagraph: e.target.value })}
                  rows={3}
                  className="au26-textarea text-xs"
                />
              </div>
            </div>
          </section>

          {/* Section 4: Our Team */}
          <section className="au26-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-white/10">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isId ? "4. Tim Pengembang & Anggota" : "4. Our Team Members"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isId
                    ? "Kelola profil 6 anggota tim yang tampil di halaman Tentang Kami."
                    : "Manage 6 team member profiles displayed on About Us."}
                </p>
              </div>
              <Switch
                checked={state.ourTeam.enabled}
                onChange={(enabled) => updateOurTeam({ enabled })}
                ariaLabel={isId ? "Aktifkan seksi tim" : "Enable team section"}
              />
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isId ? "Judul Seksi Tim" : "Team Section Title"}
                  </label>
                  <input
                    type="text"
                    value={state.ourTeam.title}
                    onChange={(e) => updateOurTeam({ title: e.target.value })}
                    className="au26-input text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isId ? "Deskripsi Seksi Tim" : "Team Section Description"}
                  </label>
                  <input
                    type="text"
                    value={state.ourTeam.description}
                    onChange={(e) => updateOurTeam({ description: e.target.value })}
                    className="au26-input text-xs"
                  />
                </div>
              </div>

              {/* Member Selection Pills */}
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {isId ? "Pilih Anggota untuk Diedit:" : "Select Member to Edit:"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {state.ourTeam.members.map((member, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveMemberIdx(idx)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        activeMemberIdx === idx
                          ? "bg-[#034c85] text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{member.title || `Member ${idx + 1}`}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Member Card Editor */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/5 dark:bg-slate-900/60 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-white/10">
                  <span className="text-xs font-black text-[#034c85] dark:text-sky-400">
                    {isId ? `Edit Anggota ${activeMemberIdx + 1}` : `Editing Member ${activeMemberIdx + 1}`}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {activeMember.title}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                  <ImageUploadDropzone
                    id={`au-member-img-${activeMemberIdx}`}
                    label={isId ? "Foto Profil" : "Avatar Photo"}
                    specNote="300×300 px"
                    value={activeMember.imageDataUrl}
                    onChange={(url) => updateMember(activeMemberIdx, { imageDataUrl: url })}
                    onRemove={() => updateMember(activeMemberIdx, { imageDataUrl: "" })}
                    isId={isId}
                  />

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {isId ? "Nama Anggota" : "Member Name"}
                      </label>
                      <input
                        type="text"
                        value={activeMember.title}
                        placeholder={isId ? "Nama lengkap..." : "Full name..."}
                        onChange={(e) => updateMember(activeMemberIdx, { title: e.target.value })}
                        className="au26-input text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {isId ? "Jabatan / Peran" : "Role / Title"}
                      </label>
                      <textarea
                        value={activeMember.subTitle}
                        placeholder={isId ? "Jabatan atau keahlian..." : "Role or specialization..."}
                        onChange={(e) => updateMember(activeMemberIdx, { subTitle: e.target.value })}
                        rows={2}
                        className="au26-textarea text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Realistic 1:1 Live Storefront Preview */}
        <div className="space-y-4">
          <section className="au26-card p-5 sticky top-20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-white/10">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  {isId ? "Pratinjau Etalase Langsung" : "Live Storefront Preview"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isId
                    ? "Simulasi 1:1 tampilan halaman Tentang Kami di toko pembeli."
                    : "1:1 real-time simulation on customer About Us page."}
                </p>
              </div>

              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-white/10 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  title={isId ? "Mode Desktop" : "Desktop View"}
                  className={`flex h-7 w-8 items-center justify-center rounded-lg text-xs transition ${
                    previewDevice === "desktop"
                      ? "bg-white text-[#034c85] font-bold shadow-sm dark:bg-slate-800 dark:text-white"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  title={isId ? "Mode Ponsel" : "Mobile View"}
                  className={`flex h-7 w-8 items-center justify-center rounded-lg text-xs transition ${
                    previewDevice === "mobile"
                      ? "bg-white text-[#034c85] font-bold shadow-sm dark:bg-slate-800 dark:text-white"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mockup Frame */}
            <div
              className={`au26-preview-frame transition-all duration-300 max-h-[750px] overflow-y-auto scrollbar-thin ${
                previewDevice === "mobile" ? "mx-auto max-w-[340px]" : "w-full"
              }`}
            >
              <div className="space-y-4 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-slate-200/90 dark:border-white/10">
                {/* 1. Header Banner Mockup */}
                {state.pageHeader.enabled ? (
                  <div
                    className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#034c85] to-[#023864] p-4 text-white text-center"
                    style={
                      state.pageHeader.backgroundImageDataUrl
                        ? {
                            backgroundImage: `linear-gradient(rgba(3, 76, 133, 0.8), rgba(2, 56, 100, 0.9)), url(${state.pageHeader.backgroundImageDataUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : {}
                    }
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#fe6f05] bg-white/10 px-2 py-0.5 rounded-full inline-block mb-1">
                      TP PRENEURS
                    </span>
                    <h4 className="text-base font-black truncate">
                      {state.pageHeader.pageTitle}
                    </h4>
                  </div>
                ) : null}

                {/* 2. Hero Story & 3 Pillars Mockup */}
                {state.topContentLeft.enabled ? (
                  <div className="space-y-2.5 pt-2">
                    <span className="text-[10px] font-extrabold uppercase text-[#fe6f05] tracking-wider block">
                      OUR STORY
                    </span>
                    <h5 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                      {state.topContentLeft.topTitle}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {state.topContentLeft.topDescription}
                    </p>

                    {/* 3 Pillars Mockup */}
                    <div className="grid gap-2 pt-1 sm:grid-cols-3">
                      {[state.topContentLeft.boxOne, state.topContentLeft.boxTwo, state.topContentLeft.boxThree].map(
                        (box, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-slate-200 bg-slate-50/80 p-2 text-center dark:border-white/5 dark:bg-slate-800"
                          >
                            <span className="text-[10px] font-black text-[#034c85] dark:text-sky-400 block truncate">
                              {box.title}
                            </span>
                            <span className="text-[9px] text-[#fe6f05] font-semibold block truncate">
                              {box.subtitle}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : null}

                {/* 3. Vision & Mission Mockup */}
                {state.contentSection.enabled ? (
                  <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-[#034c85] dark:text-sky-400 tracking-wider block">
                      VISION & MISSION
                    </span>
                    <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/5 space-y-1.5">
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                        <strong className="text-slate-900 dark:text-white">Visi: </strong>
                        {state.contentSection.firstParagraph}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                        <strong className="text-slate-900 dark:text-white">Misi: </strong>
                        {state.contentSection.secondParagraph}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* 4. Our Team Mockup */}
                {state.ourTeam.enabled ? (
                  <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-slate-800 dark:text-white tracking-wider">
                        {state.ourTeam.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        6 Anggota
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {state.ourTeam.members.map((member, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-slate-200 bg-white p-2 text-center shadow-xs dark:border-white/10 dark:bg-slate-800"
                        >
                          <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-700">
                            {member.imageDataUrl ? (
                              <img
                                src={member.imageDataUrl}
                                alt={member.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <span className="block text-[11px] font-bold text-slate-900 dark:text-white truncate">
                            {member.title}
                          </span>
                          <span className="block text-[9px] text-slate-500 dark:text-slate-400 truncate">
                            {member.subTitle}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <footer className="au26-sticky-bar">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#fe6f05] animate-pulse" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {isId
              ? "Kustomisasi Halaman Tentang Kami (Draf Aktif)"
              : "About Us Customization (Draft Active)"}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onReset}
            disabled={isSaving || isPublishing}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isId ? "Reset ke Awal" : "Reset Default"}</span>
          </button>

          <button
            type="button"
            onClick={() => onSave?.({ publish: false })}
            disabled={isSaving || isPublishing}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-xs font-black text-slate-800 shadow-sm hover:border-[#034c85] hover:text-[#034c85] disabled:opacity-50 dark:border-white/15 dark:bg-slate-900 dark:text-white"
          >
            <Save className="h-3.5 w-3.5 text-slate-500" />
            <span>{isSaving ? (isId ? "Menyimpan..." : "Saving...") : isId ? "Simpan Draf" : "Save Draft"}</span>
          </button>

          <button
            type="button"
            onClick={onPublish}
            disabled={isSaving || isPublishing}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#034c85] px-4 text-xs font-black text-white shadow-sm hover:bg-[#023864] disabled:opacity-50"
          >
            <Rocket className="h-3.5 w-3.5 text-[#fe6f05]" />
            <span>{isPublishing ? (isId ? "Menerbitkan..." : "Publishing...") : isId ? "Publikasikan" : "Publish Draft"}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

