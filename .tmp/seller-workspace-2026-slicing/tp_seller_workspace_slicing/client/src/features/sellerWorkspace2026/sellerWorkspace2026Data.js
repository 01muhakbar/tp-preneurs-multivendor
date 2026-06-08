export const sellerStore = {
  name: 'Tokoku Digital',
  id: '10233',
  owner: 'Rizky Pratama',
  role: 'Seller',
  status: 'Active',
  rating: '4.9',
  ordersDone: '98%',
  response: '< 2h',
  slug: 'tokoku-digital',
  url: 'vendora.id/tokoku-digital',
};

export const navItems = [
  ['overview', 'Overview'],
  ['profile', 'Store Profile'],
  ['catalog', 'Catalog'],
  ['orders', 'Orders'],
  ['payment', 'Payment Center'],
  ['coupons', 'Coupons'],
  ['team', 'Team'],
  ['analytics', 'Analytics & Sync'],
];

export const kpis = [
  { label: 'Revenue', value: 'Rp 128,450,000', trend: '+18.6%', tone: 'violet' },
  { label: 'Total Orders', value: '1,842', trend: '+14.3%', tone: 'blue' },
  { label: 'Active Products', value: '318', trend: '+5.2%', tone: 'orange' },
  { label: 'Conversion Rate', value: '3.62%', trend: '+0.6pp', tone: 'green' },
  { label: 'Payout Status', value: 'Ready', trend: 'May 25', tone: 'emerald' },
];

export const products = [
  { name: 'iPhone 15 Pro Max 256GB', sku: 'IPH15PM-256-NTR', price: 'Rp 16,250,000', stock: 24, category: 'Phone & Tablet', status: 'Published', review: 'Approved', visibility: 'Visible' },
  { name: 'Nike Air Force 1 07', sku: 'NK-AF1-07-WHT-42', price: 'Rp 1,299,000', stock: 58, category: 'Men Fashion', status: 'Published', review: 'Approved', visibility: 'Visible' },
  { name: 'Garmin Fenix 7 Sapphire Solar', sku: 'GRM-F7-SS', price: 'Rp 8,950,000', stock: 12, category: 'Electronics', status: 'In Review', review: 'Waiting', visibility: 'Visible' },
  { name: 'Urban Minimalist Backpack', sku: 'BAG-URB-BLK', price: 'Rp 349,000', stock: 0, category: 'Bags', status: 'Needs Revision', review: 'Needs Revision', visibility: 'Visible' },
  { name: 'Sony WF-1000XM5', sku: 'SONY-WF1000XM5-BLK', price: 'Rp 2,899,000', stock: 36, category: 'Audio', status: 'Published', review: 'Approved', visibility: 'Visible' },
  { name: 'Logitech MX Keys S', sku: 'LOGI-MXK-S-GRP', price: 'Rp 1,659,000', stock: 18, category: 'Computer Accessories', status: 'Draft', review: 'Draft', visibility: 'Hidden' },
];

export const orders = [
  { id: 'INV/2025/05/21/10233', customer: 'Andi Wijaya', product: 'Wireless Headphone Pro', channel: 'Tokopedia', payment: 'Paid', fulfillment: 'Ready to Ship', courier: 'JNE', total: 'Rp 1,250,000', sla: '23h' },
  { id: 'INV/2025/05/21/10234', customer: 'Siti Nurhaliza', product: 'Smartwatch Series 5', channel: 'Shopee', payment: 'Paid', fulfillment: 'Packing', courier: 'J&T', total: 'Rp 875,000', sla: '20h' },
  { id: 'INV/2025/05/21/10235', customer: 'Budi Santoso', product: 'Mechanical Keyboard', channel: 'Lazada', payment: 'COD', fulfillment: 'New Order', courier: 'SiCepat', total: 'Rp 650,000', sla: '1d' },
  { id: 'INV/2025/05/21/10236', customer: 'Dewi Lestari', product: 'Powerbank 20,000mAh', channel: 'Storefront', payment: 'Paid', fulfillment: 'Shipped', courier: 'JNE', total: 'Rp 249,000', sla: '2d' },
  { id: 'INV/2025/05/21/10237', customer: 'Rizky Maulana', product: 'Bluetooth Speaker Mini', channel: 'TikTok Shop', payment: 'Paid', fulfillment: 'Shipped', courier: 'J&T', total: 'Rp 398,000', sla: '1d' },
];

export const coupons = [
  { code: 'TOKOKU20', scope: 'All Products', type: '20% Percentage Discount', validity: 'May 21 - Jun 21 2025', min: 'Rp 100,000', usage: '1,245 / 5,000', attribution: 'Tokoku Digital', status: 'Active' },
  { code: 'HEMAT10K', scope: 'Selected Products', type: 'Rp 10,000 Fixed Discount', validity: 'May 10 - Jun 10 2025', min: 'Rp 50,000', usage: '862 / 2,000', attribution: 'Tokoku Digital', status: 'Active' },
  { code: 'NEWBUYER15', scope: 'New Buyers', type: '15% Percentage Discount', validity: 'May 1 - May 31 2025', min: 'Rp 0', usage: '3,245 / 10,000', attribution: 'Admin Platform', status: 'Ended' },
  { code: 'MEGASALE25', scope: 'Category Based', type: '25% Percentage Discount', validity: 'May 24 - May 27 2025', min: 'Rp 200,000', usage: '512 / 1,000', attribution: 'Tokoku Digital', status: 'Active' },
];

export const team = [
  { name: 'Rizky Pratama', email: 'rizky.pratama@tokoku.id', role: 'Owner', scope: 'All Stores', status: 'Active' },
  { name: 'Nadia Putri', email: 'nadia.putri@tokoku.id', role: 'Admin', scope: 'All Stores', status: 'Active' },
  { name: 'Fauzan Alamsyah', email: 'fauzan@tokoku.id', role: 'Staff', scope: 'Main Warehouse', status: 'Active' },
  { name: 'Maya Lestari', email: 'maya.lestari@tokoku.id', role: 'Staff', scope: 'Online Store', status: 'Active' },
  { name: 'Siti Nurhaliza', email: 'siti.nurhaliza@tokoku.id', role: 'Staff', scope: 'Online Store', status: 'Pending' },
];

export const syncChannels = [
  { name: 'Microsite', status: 'Synced', health: 'Good', lastSync: 'Jun 21 2025, 09:12' },
  { name: 'Tokopedia', status: 'Synced', health: 'Good', lastSync: 'Jun 21 2025, 09:08' },
  { name: 'Shopee', status: 'Synced', health: 'Good', lastSync: 'Jun 21 2025, 09:05' },
  { name: 'TikTok Shop', status: 'Warning', health: 'Needs Attention', lastSync: 'Jun 21 2025, 08:50' },
  { name: 'Google Merchant', status: 'Synced', health: 'Good', lastSync: 'Jun 21 2025, 08:40' },
];
