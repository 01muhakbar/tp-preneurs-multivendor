export const sellerStore = {
  name: "Batik Nusantara Store",
  owner: "Dewi Lestari",
  role: "Store Owner",
  avatar: "DL",
  dateRange: "18 Mei 2026 - 24 Mei 2026",
  revenue: "Rp 128.450.000",
  orders: "1.248",
  productsSold: "2.842",
  conversion: "3,24%",
};

export const navGroups = [
  { title: "Overview", items: [{ key: "dashboard", label: "Dashboard" }] },
  { title: "Storefront", items: [{ key: "store-profile", label: "Store Profile" }, { key: "microsite", label: "Microsite Preview" }] },
  { title: "Catalog", items: [{ key: "products", label: "Products" }, { key: "categories", label: "Categories" }, { key: "attributes", label: "Attributes" }, { key: "coupons", label: "Coupons" }] },
  { title: "Orders", items: [{ key: "orders", label: "All Orders" }, { key: "fulfillment", label: "Fulfillment Queue" }] },
  { title: "Payments", items: [{ key: "payment-review", label: "Payment Review" }, { key: "payment-profile", label: "Payment Profile" }] },
  { title: "Team", items: [{ key: "members", label: "Members" }, { key: "invitations", label: "Invitations" }, { key: "audit", label: "Audit Log" }] },
  { title: "System", items: [{ key: "notifications", label: "Notifications", badge: "12" }, { key: "settings", label: "Settings" }] },
];

export const kpis = [
  { label: "Total Revenue", value: "Rp 128.450.000", change: "+18,6% vs minggu lalu", tone: "indigo" },
  { label: "Total Orders", value: "1.248", change: "+12,4% vs minggu lalu", tone: "emerald" },
  { label: "Products Sold", value: "2.842", change: "+15,7% vs minggu lalu", tone: "teal" },
  { label: "Conversion Rate", value: "3,24%", change: "+0,42 pp vs minggu lalu", tone: "violet" },
];

export const readiness = [
  { label: "Store Profile", status: "Selesai" },
  { label: "Upload Logo & Banner", status: "Selesai" },
  { label: "Tambah Produk >= 10", status: "Selesai" },
  { label: "Atur Pengiriman", status: "Selesai" },
  { label: "Atur Pembayaran", status: "Dalam Proses" },
  { label: "Verifikasi Identitas", status: "Belum" },
];

export const products = [
  { name: "Hijab Voal Premium", category: "Fashion / Hijab", sku: "HJP-VOAL-01-BLK", stock: 120, price: "89.000", sales: "1.248", views: "8.432", status: "Active", updated: "18 Mei 2026" },
  { name: "Kaos Oversize Unisex", category: "Fashion / Tops", sku: "KAOS-OVZ-02-WHT", stock: 320, price: "129.000", sales: "932", views: "6.210", status: "Active", updated: "17 Mei 2026" },
  { name: "Totebag Canvas Minimalis", category: "Bags / Tote", sku: "TBG-CNV-03-BGE", stock: 85, price: "149.000", sales: "412", views: "3.125", status: "Needs Revision", updated: "16 Mei 2026" },
  { name: "Botol Minum Stainless", category: "Home / Drinkware", sku: "BOT-STL-04-GRY", stock: 56, price: "199.000", sales: "228", views: "2.010", status: "Submitted", updated: "15 Mei 2026" },
  { name: "Skincare Brightening Serum", category: "Beauty / Skincare", sku: "SKN-BRG-05-30ML", stock: 200, price: "235.000", sales: "678", views: "5.432", status: "Active", updated: "15 Mei 2026" },
  { name: "Sandal Casual Pria", category: "Fashion / Footwear", sku: "SND-CL-06-BLK", stock: 0, price: "179.000", sales: "132", views: "1.245", status: "Inactive", updated: "14 Mei 2026" },
  { name: "Jam Tangan Analog", category: "Accessories / Watches", sku: "JAM-ANL-07-BLK", stock: 42, price: "299.000", sales: "365", views: "2.998", status: "Needs Revision", updated: "13 Mei 2026" },
  { name: "Dompet Kulit Asli", category: "Accessories / Wallets", sku: "DPT-KLT-08-BRN", stock: 18, price: "249.000", sales: "218", views: "1.876", status: "Draft", updated: "12 Mei 2026" },
];

export const topProducts = [
  ["Kemeja Batik Parang", "652", "Rp 32.850.000", "+14,2%"],
  ["Dress Batik Kawung", "487", "Rp 24.560.000", "+9,8%"],
  ["Selendang Batik Mega Mendung", "326", "Rp 15.680.000", "+21,3%"],
  ["Outer Batik Truntum", "289", "Rp 12.980.000", "+7,6%"],
  ["Blouse Batik Ceplok", "213", "Rp 9.750.000", "+11,1%"],
];

export const suborders = [
  { id: "SO-250524-00132", customer: "Andi Pratama", status: "Menunggu Pembayaran", time: "24 Mei 2026, 14:32" },
  { id: "SO-250524-00131", customer: "Siti Nurhaliza", status: "Dikemas", time: "24 Mei 2026, 13:58" },
  { id: "SO-250524-00130", customer: "Rizky Maulana", status: "Dikirim", time: "24 Mei 2026, 11:24" },
  { id: "SO-250523-00129", customer: "Dewi Anggraini", status: "Terkirim", time: "23 Mei 2026, 18:45" },
  { id: "SO-250523-00128", customer: "Budi Santoso", status: "Selesai", time: "23 Mei 2026, 16:12" },
];

export const orders = [
  { date: "24 Mei 2026 14:32", invoice: "INV/2026/05/02432", suborder: "SUB-02432-01", customer: "Rina Agustina", channel: "Tokopedia", ship: "JNE Reguler", total: "Rp 258.000", status: "UNPAID" },
  { date: "24 Mei 2026 14:21", invoice: "INV/2026/05/02431", suborder: "SUB-02431-01", customer: "Budi Santoso", channel: "Shopee", ship: "J&T Express", total: "Rp 189.000", status: "PENDING_CONFIRMATION" },
  { date: "24 Mei 2026 13:58", invoice: "INV/2026/05/02430", suborder: "SUB-02430-01", customer: "Dewi Lestari", channel: "Tokopedia", ship: "SiCepat HALU", total: "Rp 312.000", status: "PROCESSING" },
  { date: "24 Mei 2026 13:41", invoice: "INV/2026/05/02429", suborder: "SUB-02429-01", customer: "Andi Pratama", channel: "Lazada", ship: "JNE YES", total: "Rp 575.000", status: "SHIPPED" },
  { date: "24 Mei 2026 13:22", invoice: "INV/2026/05/02428", suborder: "SUB-02428-01", customer: "Siti Nurhaliza", channel: "TikTok Shop", ship: "SiCepat BEST", total: "Rp 147.500", status: "DELIVERED" },
];

export const categories = [
  ["Fashion", "913", "96%"], ["Women", "1.248", "96%"], ["Men", "954", "92%"], ["Kids", "432", "88%"],
  ["Home & Living", "768", "90%"], ["Beauty & Personal Care", "420", "91%"], ["Electronics", "318", "85%"],
];

export const attributes = [
  ["Color", "Variant", "2.614", "24", "Active"], ["Size", "Variant", "2.381", "18", "Active"], ["Material", "Variant", "1.892", "15", "Active"], ["Pattern", "Variant", "1.276", "12", "Active"], ["Brand", "General", "2.482", "126", "Active"], ["Gender", "General", "2.102", "3", "Active"], ["Occasion", "General", "1.034", "8", "Active"],
];

export const coupons = [
  ["WELCOME10", "% Off", "10%", "Rp 0", "342 / 1.000", "Active"], ["SAVE20", "% Off", "20%", "Rp 200.000", "186 / 500", "Active"], ["FREESHIP", "Free Shipping", "-", "421 / inf", "Active"], ["RAMADAN50", "Rp Off", "Rp 50.000", "278 / 1.000", "Expired"], ["NEWUSER15", "% Off", "15%", "64 / 500", "Active"], ["CLEARANCE30", "% Off", "30%", "95 / 300", "Paused"], ["LOYALTY25", "% Off", "25%", "0 / 200", "Scheduled"],
];

export const members = [
  ["Dewi Lestari", "Store Owner", "All Permissions", "Online", "Active"], ["Budi Herman", "Store Admin", "Catalog, Orders, Payments", "Today 09:41", "Active"], ["Siti Aisyah", "Catalog Manager", "Catalog, Stock", "Today 08:15", "Active"], ["Rizky Pratama", "Order Manager", "Orders, Returns, Fulfillment", "Yesterday 17:32", "Active"], ["Maya Putri", "Payment Reviewer", "Payments, Refunds", "Yesterday 16:20", "Active"], ["Fajar Nugroho", "Support Staff", "Orders Read, Chat", "21 Mei 2026", "Active"],
];

export const notifications = [
  ["Order #ORD-20260524-128 has been placed", "Orders", "High", "9:41 AM"],
  ["Low stock alert for 3 products", "Stock & Inventory", "High", "9:15 AM"],
  ["Payment review required", "Payments", "Medium", "8:52 AM"],
  ["New team invitation pending", "Team & Access", "Medium", "Yesterday"],
  ["Product stock updated", "Stock & Inventory", "Low", "Yesterday"],
  ["Payout has been processed", "Payments", "Low", "22 Mei 2026"],
];
