import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  Filter,
  Gift,
  Globe2,
  Home,
  ImagePlus,
  LayoutGrid,
  Moon,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Ticket,
  Truck,
  Upload,
  Users,
  Wallet,
} from 'lucide-react';
import './SellerWorkspace2026.css';
import { coupons, kpis, navItems, orders, products, sellerStore, syncChannels, team } from './sellerWorkspace2026Data';

const icons = {
  overview: Home,
  profile: StoreIcon,
  catalog: LayoutGrid,
  orders: PackageCheck,
  payment: CreditCard,
  coupons: Ticket,
  team: Users,
  analytics: BarChart3,
};

function StoreIcon(props) {
  return <ShoppingBag {...props} />;
}

function cx(...list) {
  return list.filter(Boolean).join(' ');
}

function Pill({ children, tone = 'green' }) {
  return <span className={cx('seller26__pill', tone !== 'green' && tone)}>{children}</span>;
}

function Button({ children, primary, success, danger, icon: Icon, ...props }) {
  return (
    <button className={cx('seller26__btn', primary && 'primary', success && 'success', danger && 'danger')} {...props}>
      {Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

function Sidebar({ page, setPage }) {
  return (
    <aside className="seller26__sidebar">
      <div className="seller26__brand">
        <div className="seller26__brand-mark"><ShoppingBag size={24} /></div>
        <div>
          <h1>Vendora</h1>
          <span>Seller Workspace</span>
        </div>
      </div>

      <div className="seller26__store-card">
        <div className="seller26__logo-tile">🛒</div>
        <div style={{ flex: 1 }}>
          <strong>{sellerStore.name}</strong>
          <span>Store ID: {sellerStore.id}</span>
        </div>
        <ChevronDown size={16} />
      </div>

      <nav className="seller26__nav" aria-label="Seller workspace navigation">
        {navItems.map(([key, label]) => {
          const Icon = icons[key] || Home;
          const active = page === key || (page === 'authoring' && key === 'catalog') || (page === 'review' && key === 'catalog');
          return (
            <button key={key} className={active ? 'is-active' : ''} onClick={() => setPage(key)} type="button">
              <Icon size={18} />
              <span>{label}</span>
              {key === 'orders' ? <span className="seller26__badge">18</span> : null}
              {key === 'payment' ? <span className="seller26__badge warn">3</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="seller26__promo">
        <strong>Grow your sales</strong>
        <p>Connect your store to more public channels and increase reach.</p>
        <Button primary icon={Sparkles}>Learn More</Button>
      </div>
      <div className="seller26__plan">
        <strong>Plan: Pro Seller</strong>
        <p>Active until Jul 12, 2026</p>
        <div className="seller26__progress"><span style={{ width: '70%' }} /></div>
        <p>70% used</p>
        <Button>Manage Plan</Button>
      </div>
    </aside>
  );
}

function Topbar({ title }) {
  return (
    <header className="seller26__topbar">
      <div className="seller26__breadcrumb">Dashboard&nbsp;&nbsp;/&nbsp;&nbsp;<strong>{title}</strong></div>
      <label className="seller26__search">
        <Search size={18} />
        <input placeholder="Search orders, products, or customers..." />
        <span className="seller26__shortcut">⌘ K</span>
      </label>
      <button className="seller26__icon-button" type="button" aria-label="Notifications"><Bell size={19} /><span className="seller26__notif-dot">12</span></button>
      <button className="seller26__theme" type="button" aria-label="Theme toggle"><Sun size={15} /><Moon size={15} /></button>
      <div className="seller26__avatar">
        <div className="seller26__avatar-img">RP</div>
        <div><strong>{sellerStore.owner}</strong><span>{sellerStore.role}</span></div>
        <ChevronDown size={16} />
      </div>
    </header>
  );
}

function Shell({ page, setPage, title, children }) {
  return (
    <div className="seller26">
      <Sidebar page={page} setPage={setPage} />
      <main className="seller26__main">
        <Topbar title={title} />
        <div className="seller26__content">{children}</div>
      </main>
    </div>
  );
}

function KpiCards({ list = kpis }) {
  return <div className="seller26__kpi-row">{list.map((item) => <div className="seller26__kpi" key={item.label}><small>{item.label}</small><strong>{item.value}</strong><Pill tone="green">{item.trend}</Pill><div className="seller26__spark" /></div>)}</div>;
}

function ChartCard({ title, value, tone = '#6d4aff' }) {
  return (
    <div className="seller26__card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div><h3>{title}</h3><strong style={{ fontSize: 24 }}>{value}</strong> <Pill>+18.6%</Pill></div>
        <select className="seller26__field"><option>Last 30 days</option></select>
      </div>
      <div className="seller26__chart" style={{ marginTop: 16 }}>
        <svg viewBox="0 0 600 220" preserveAspectRatio="none"><path d="M0 160 L50 140 L100 150 L150 90 L200 120 L250 70 L300 115 L350 58 L400 86 L450 42 L500 96 L550 66 L600 88" fill="none" stroke={tone} strokeWidth="4"/><path d="M0 160 L50 140 L100 150 L150 90 L200 120 L250 70 L300 115 L350 58 L400 86 L450 42 L500 96 L550 66 L600 88 L600 220 L0 220 Z" fill={tone} opacity=".10"/></svg>
      </div>
    </div>
  );
}

function OverviewPage({ setPage }) {
  return (
    <Shell page="overview" setPage={setPage} title="Overview">
      <section className="seller26__hero">
        <div className="seller26__hero-store">
          <div className="seller26__store-logo">🛒</div>
          <div>
            <h2>{sellerStore.name} <Pill>{sellerStore.status}</Pill></h2>
            <div className="seller26__meta"><span>Joined Mar 12, 2024</span><span>Store ID: {sellerStore.id}</span><span>★ {sellerStore.rating} (1,250)</span><span>{sellerStore.ordersDone} orders completed</span><span>{sellerStore.response} chat response</span></div>
          </div>
        </div>
        <div>
          <h3>Quick Actions</h3>
          <div className="seller26__quick">
            <Button primary icon={Plus} onClick={() => setPage('authoring')}>Add Product</Button>
            <Button icon={PackageCheck} onClick={() => setPage('orders')}>Manage Orders</Button>
            <Button icon={Eye}>View Storefront</Button>
            <Button icon={Ticket} onClick={() => setPage('coupons')}>Create Coupon</Button>
          </div>
        </div>
      </section>

      <div className="seller26__grid dashboard">
        <div>
          <div className="seller26__card seller26__readiness">
            {['Complete store profile', 'Set shipping options', 'Set payment profile', 'Submit product review'].map((step, idx) => <div className="seller26__step" key={step}><div className="seller26__circle">{idx < 3 ? <Check size={18} /> : '4'}</div><div><strong>{step}</strong><span>{idx < 3 ? 'Completed' : 'Product will be reviewed by Admin'}</span></div></div>)}
            <div><strong>75%</strong><div className="seller26__progress"><span style={{ width: '75%' }} /></div></div>
          </div>
          <KpiCards />
          <div className="seller26__grid cols-2">
            <ChartCard title="Revenue Chart" value="Rp 128,450,000" />
            <ChartCard title="Order Trend" value="1,842" tone="#2563eb" />
          </div>
          <div className="seller26__grid cols-2" style={{ marginTop: 18 }}>
            <OrdersMini />
            <div className="seller26__grid cols-2">
              <StatusCard title="Payment Profile" label="Verified" text="Bank transfer BCA, ready for payout." />
              <StatusCard title="Storefront Sync" label="Synced" text="Last sync: May 21, 2025 10:15." />
            </div>
          </div>
        </div>
        <aside className="seller26__side-stack">
          <ActionNeeded />
          <div className="seller26__card"><h3>Product Review Status</h3><div className="seller26__donut" /><div style={{ display:'grid', gap:8, marginTop:16 }}><Pill tone="gray">Draft 24</Pill><Pill tone="orange">In Review 12</Pill><Pill>Approved 156</Pill><Pill tone="red">Rejected 18</Pill></div></div>
          <MobilePreview />
        </aside>
      </div>
    </Shell>
  );
}

function ActionNeeded() {
  return <div className="seller26__card"><h3>Action Needed <Pill tone="red">3</Pill></h3>{['3 products need revision', '2 products waiting for review', 'Verify payment profile'].map((x, i) => <div key={x} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--sw-border)' }}><span>{x}<br/><small style={{ color:'var(--sw-muted)' }}>{i === 0 ? 'Updated today' : 'Pending action'}</small></span><ChevronDown size={16} /></div>)}</div>;
}

function OrdersMini() {
  return <div className="seller26__card"><h3>Recent Orders</h3><table className="seller26__table"><tbody>{orders.slice(0,3).map((order) => <tr key={order.id}><td>{order.id}</td><td>{order.customer}</td><td>{order.total}</td><td><Pill tone="blue">{order.fulfillment}</Pill></td></tr>)}</tbody></table></div>;
}

function StatusCard({ title, label, text }) {
  return <div className="seller26__card"><h3>{title} <Pill>{label}</Pill></h3><p>{text}</p><Button icon={Settings}>Manage</Button></div>;
}

function MobilePreview() {
  return <div className="seller26__preview"><h3>Mobile Preview</h3><p>Responsive seller workspace preview for mobile devices.</p><div className="seller26__phone"><div className="seller26__phone-screen"><strong>{sellerStore.name}</strong><KpiCards list={kpis.slice(0,1)} /></div></div></div>;
}

function PageHead({ title, subtitle, children }) {
  return <div className="seller26__page-head"><div><h2>{title}</h2><p>{subtitle}</p></div><div className="seller26__actions">{children}</div></div>;
}

function StoreProfilePage({ setPage }) {
  return (
    <Shell page="profile" setPage={setPage} title="Store Profile">
      <div className="seller26__hero" style={{ gridTemplateColumns: '1fr auto' }}><div className="seller26__hero-store"><div className="seller26__store-logo">🛒</div><div><h2>{sellerStore.name} <Pill>Active</Pill></h2><div className="seller26__meta"><span>Store ID: {sellerStore.id}</span><span>★ 4.9</span><span>98% Orders Completed</span><span>&lt; 2h Chat Response</span></div></div></div><div className="seller26__actions"><Button primary icon={Check}>Save</Button><Button icon={Eye}>Preview Storefront</Button><Button icon={RefreshCw}>View History</Button></div></div>
      <div className="seller26__tabs">{['Basic Information','Branding','Domain & Slug','Contact','Social Media','Shipping Setup'].map((tab,i)=><button className={i===0?'is-active':''} key={tab}>{tab}</button>)}</div>
      <div className="seller26__grid cols-2">
        <div className="seller26__grid">
          <div className="seller26__card"><h3>Store Information</h3><div className="seller26__form-grid"><label>Store Name<input className="seller26__field" defaultValue="Tokoku Digital" /></label><label>Main Category<select><option>Electronics</option></select></label><label style={{ gridColumn:'1 / -1' }}>Store Description<textarea defaultValue="Trusted digital store for original products, friendly prices, fast service, and secure fulfillment." /></label><label>Sub Category<select><option>Computer Accessories</option></select></label><label>Operating Hours<input className="seller26__field" defaultValue="09:00 - 21:00" /></label><label style={{ gridColumn:'1 / -1' }}>Store Address<textarea defaultValue="Jl. Merdeka No. 123, Menteng, Jakarta Pusat, DKI Jakarta 10310" /></label></div></div>
          <div className="seller26__grid cols-2"><div className="seller26__card"><h3>Primary Contact</h3><label>WhatsApp<input className="seller26__field full" defaultValue="6281234567890" /></label><br/><label>Email<input className="seller26__field full" defaultValue="hello@tokokudigital.com" /></label></div><div className="seller26__card"><h3>Social Media</h3>{['Instagram @tokokudigital','TikTok @tokokudigital','Facebook Tokoku Digital','YouTube Tokoku Digital'].map(x=><p key={x}>{x}</p>)}</div></div>
        </div>
        <div className="seller26__side-stack"><div className="seller26__card"><h3>Logo & Banner</h3><div className="seller26__storefront"><strong>Digital Products</strong><p>Original & trusted. Best price with official warranty.</p></div><br/><Button icon={Upload}>Upload Logo</Button> <Button icon={ImagePlus}>Upload Banner</Button></div><div className="seller26__card"><h3>Domain & Slug</h3><label>Store Slug<input className="seller26__field full" defaultValue="tokoku-digital" /></label><p><Pill>Available</Pill> {sellerStore.url}</p></div><div className="seller26__card"><h3>Store Readiness</h3><div className="seller26__donut" style={{ background:'conic-gradient(#16a34a 0 85%,#e5e7eb 85%)' }} /><p>85% ready. Complete shipping setup to publish storefront.</p></div><div className="seller26__card"><h3>Shipping Setup</h3>{['JNE','J&T Express','SiCepat','Anteraja','Pos Indonesia'].map((x,i)=><p key={x}><Pill tone={i<3?'green':'gray'}>{i<3?'Active':'Disabled'}</Pill> {x}</p>)}</div></div>
      </div>
    </Shell>
  );
}

function CatalogPage({ setPage }) {
  return (
    <Shell page="catalog" setPage={setPage} title="Product Catalog">
      <PageHead title="Product Catalog" subtitle="Manage all products in one seller workspace."><Button primary icon={Plus} onClick={() => setPage('authoring')}>Add Product</Button><Button icon={Upload}>Import</Button><Button icon={Upload}>Export</Button></PageHead>
      <div className="seller26__tabs">{['Products','Categories','Attributes','Attribute Values'].map((tab,i)=><button className={i===0?'is-active':''} key={tab}>{tab}</button>)}</div>
      <KpiCards list={[{label:'Total Products',value:'1,842',trend:'+11.4%'},{label:'Draft',value:'126',trend:'+6.8%'},{label:'In Review',value:'92',trend:'+5.0%'},{label:'Published',value:'1,512',trend:'+14.9%'},{label:'Needs Revision',value:'112',trend:'-2.1%'}]} />
      <div className="seller26__grid" style={{ gridTemplateColumns:'1fr 270px' }}><div><div className="seller26__filters"><input placeholder="Search product, SKU, or product name..."/><select><option>All Categories</option></select><select><option>All Status</option></select><select><option>All Visibility</option></select><Button icon={Filter}>More Filters</Button></div><ProductTable setPage={setPage} /></div><CatalogSide /></div>
    </Shell>
  );
}

function ProductTable({ setPage }) {
  return <div className="seller26__card" style={{ overflowX:'auto' }}><table className="seller26__table"><thead><tr><th>Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>Category</th><th>Visibility</th><th>Status</th><th>Review</th><th>Updated</th></tr></thead><tbody>{products.map((product, i) => <tr key={product.sku} onClick={() => setPage('review')} style={{ cursor:'pointer' }}><td><div className="seller26__product-cell"><div className="seller26__thumb">{['📱','👟','⌚','🎒','🎧','⌨️'][i]}</div><strong>{product.name}</strong></div></td><td>{product.sku}</td><td>{product.price}</td><td>{product.stock}</td><td>{product.category}</td><td>{product.visibility}</td><td><Pill tone={product.status === 'Published' ? 'green' : product.status === 'In Review' ? 'orange' : product.status === 'Needs Revision' ? 'red' : 'gray'}>{product.status}</Pill></td><td>{product.review}</td><td>May 21, 2025</td></tr>)}</tbody></table></div>;
}

function CatalogSide() {
  return <div className="seller26__side-stack"><div className="seller26__card"><h3>Catalog Shortcuts</h3>{['All Products 1,842','Draft 126','In Review 92','Published 1,512','Needs Revision 112','Archived 84'].map(x=><p key={x}>{x}</p>)}</div><div className="seller26__card"><h3>Popular Categories</h3>{['Phone & Tablet 456','Men Fashion 312','Electronics 208','Bags 156','Audio 134'].map(x=><p key={x}>{x}</p>)}</div><div className="seller26__card"><h3>Storefront Sync</h3><Pill>Successful</Pill><p>Last sync: May 21 2025, 14:30</p></div></div>;
}

function ProductAuthoringPage({ setPage }) {
  return <Shell page="authoring" setPage={setPage} title="Add Product"><PageHead title="Add Product" subtitle="Create a product and submit it to Admin review."><Button>Save Draft</Button><Button icon={Eye}>Preview</Button><Button primary icon={ShieldCheck}>Submit for Review</Button></PageHead><div className="seller26__tabs">{['Basic Info','Media','Variants','Pricing','Inventory','Shipping','SEO','Publishing'].map((tab,i)=><button className={i===0?'is-active':''} key={tab}>{i+1}. {tab}</button>)}</div><div className="seller26__grid cols-2"><div className="seller26__card"><h3>Basic Product Information</h3><div className="seller26__form-grid"><label>Product Name<input className="seller26__field" defaultValue="Wireless Headphone Pro Max 2026 - Noise Cancelling" /></label><label>Category<select><option>Electronics &gt; Audio &gt; Headphone</option></select></label><label>Brand<input className="seller26__field" defaultValue="SoundNova" /></label><label>Model<input className="seller26__field" defaultValue="SN-HPX2026" /></label><label style={{gridColumn:'1 / -1'}}>Description<textarea defaultValue="Immersive audio quality with next generation active noise cancelling, 60-hour battery, and stable Bluetooth 5.4 connection." /></label><label>Product Type<select><option>Physical</option></select></label><label>Condition<select><option>New</option></select></label><label>Warranty<select><option>Official Warranty 12 Months</option></select></label><label>Origin<select><option>Indonesia</option></select></label></div></div><div className="seller26__side-stack"><div className="seller26__card"><h3>Product Identity</h3><label>Parent SKU<input className="seller26__field full" defaultValue="SN-HPX2026" /></label><br/><label>Barcode<input className="seller26__field full" placeholder="Enter barcode" /></label><p><Pill tone="purple">Variants Enabled</Pill> Color, size, and package options.</p></div><div className="seller26__card"><h3>Product Preview</h3><div style={{textAlign:'center'}}><div className="seller26__thumb" style={{width:160,height:160,margin:'auto',fontSize:70}}>🎧</div><h3>Wireless Headphone Pro Max 2026</h3><strong style={{fontSize:22,color:'var(--sw-purple)'}}>Rp 1,499,000</strong><p>Stock: 120 • Sold: 342</p><Pill>Free Shipping</Pill> <Pill tone="blue">Official Warranty</Pill></div></div><div className="seller26__card"><h3>Completeness & Validation</h3>{['Basic Info','Media','Variants','Pricing','Inventory','Shipping','SEO','Publishing'].map((x,i)=><p key={x}><Pill tone={i===1?'orange':i<6?'green':'gray'}>{i===1?'Needs Media':i<6?'Ready':'Pending'}</Pill> {x}</p>)}</div></div></div></Shell>;
}

function ProductReviewPage({ setPage }) {
  return <Shell page="review" setPage={setPage} title="Product Detail"><PageHead title="Product Detail" subtitle="Manage product data and submit it for Admin review."><Button icon={Copy}>Duplicate Product</Button><Button icon={ExternalLink}>View Storefront</Button><Button>Save Changes</Button><Button primary>Resubmit</Button></PageHead><div className="seller26__grid" style={{gridTemplateColumns:'1fr 320px'}}><div className="seller26__grid"><div className="seller26__card"><div className="seller26__product-cell"><div className="seller26__thumb" style={{width:220,height:160,fontSize:76}}>📱</div><div><h2>iPhone 15 Pro Max 256GB - Natural Titanium <Pill>In Review</Pill></h2><p>SKU IP15PM-256-TIN • Category Smartphone • Brand Apple</p><strong style={{fontSize:24}}>Rp 19,499,000</strong><p>Chip A17 Pro, 48MP camera, titanium grade 5, and creator-grade performance.</p><Pill>New</Pill> <Pill>12 Month Warranty</Pill> <Pill>24 Stock</Pill></div></div></div><div className="seller26__card"><h3>Product Review Flow</h3><div className="seller26__readiness">{['Draft','Submitted','In Review','Revision Requested'].map((x,i)=><div className="seller26__step" key={x}><div className="seller26__circle">{i<2?<Check size={16}/>:i+1}</div><div><strong>{x}</strong><span>{i===2?'Currently reviewed':'Completed'}</span></div></div>)}</div></div><div className="seller26__grid cols-2"><div className="seller26__card"><h3>Admin Reviewer Notes</h3><p>Please improve material information, add back box photos, and clarify warranty details.</p><Pill tone="orange">Revision Requested</Pill></div><div className="seller26__card"><h3>Compliance Checklist</h3>{['Product Data Complete 18/20','Image & Video Quality 20/20','Description Compliance 18/20','Warranty Information 20/20','Shipping Information 18/20'].map(x=><p key={x}>{x}</p>)}</div></div><div className="seller26__card"><h3>Draft v2 vs Last Approved v1</h3><table className="seller26__table"><tbody>{['Name','Category','Brand','Price','Stock','Warranty'].map((x,i)=><tr key={x}><td>{x}</td><td>v2 current value</td><td>v1 approved value</td><td><Pill tone={i===1||i===2||i===5?'gray':'green'}>{i===1||i===2||i===5?'Unchanged':'Changed'}</Pill></td></tr>)}</tbody></table></div></div><div className="seller26__side-stack"><div className="seller26__card"><h3>Review Readiness</h3><div className="seller26__donut" style={{background:'conic-gradient(#16a34a 0 82%,#e5e7eb 82%)'}} /><p>82/100 ready for review.</p></div><StatusCard title="Storefront Visibility" label="Inactive" text="Product will not be visible until Published." /><StatusCard title="Performance Snapshot" label="Last Active" text="1,842 views, 312 added to cart, 6.95% conversion." /></div></div></Shell>;
}

function OrdersPage({ setPage }) {
  return <Shell page="orders" setPage={setPage} title="Orders"><PageHead title="Orders" subtitle="Manage and fulfill customer orders from all selling channels."><Button icon={Upload}>Export</Button><Button>Import Tracking</Button><Button primary icon={Truck}>Bulk Shipment</Button></PageHead><KpiCards list={[{label:'New Orders',value:'24',trend:'+12%'},{label:'Processing',value:'58',trend:'+8%'},{label:'Shipped',value:'132',trend:'+15%'},{label:'Completed',value:'1,248',trend:'+20%'},{label:'Returns',value:'18',trend:'+5%'}]} /><div className="seller26__grid" style={{gridTemplateColumns:'1fr 360px'}}><div><div className="seller26__filters"><select><option>All Status</option></select><select><option>All Payments</option></select><select><option>All Couriers</option></select><select><option>All Channels</option></select><input defaultValue="Apr 21 2025 - May 21 2025" /></div><div className="seller26__card" style={{overflowX:'auto'}}><table className="seller26__table"><thead><tr><th>Order ID</th><th>Customer</th><th>Product</th><th>Channel</th><th>Payment</th><th>Fulfillment</th><th>Courier</th><th>Total</th><th>SLA</th></tr></thead><tbody>{orders.map(order=><tr key={order.id}><td>{order.id}</td><td>{order.customer}</td><td>{order.product}</td><td>{order.channel}</td><td><Pill>{order.payment}</Pill></td><td><Pill tone="orange">{order.fulfillment}</Pill></td><td>{order.courier}</td><td>{order.total}</td><td>{order.sla}</td></tr>)}</tbody></table></div></div><div className="seller26__side-stack"><div className="seller26__card"><h3>INV/2025/05/21/10234 <Pill tone="orange">Ready to Ship</Pill></h3><p>Customer: Siti Nurhaliza<br/>Payment: Paid via ShopeePay<br/>Total: Rp 875,000</p><div className="seller26__grid cols-2"><Button icon={Package}>Print Label</Button><Button icon={RefreshCw}>Update Status</Button><Button icon={Truck}>Input Tracking</Button><Button>More</Button></div></div><div className="seller26__card"><h3>Shipping Checklist</h3>{['Product matches order','Accessories complete','No defect checked','Packed safely','Shipping label attached'].map((x,i)=><p key={x}><Pill tone={i<3?'green':'gray'}>{i<3?'Done':'Todo'}</Pill> {x}</p>)}</div><div className="seller26__card"><h3>Order Timeline</h3><div className="seller26__timeline">{['Order Created','Payment Verified','Ready to Ship','Shipped','Completed'].map(x=><div className="seller26__timeline-item" key={x}><strong>{x}</strong><p>May 21, 2025</p></div>)}</div></div></div></div></Shell>;
}

function PaymentPage({ setPage }) {
  return <Shell page="payment" setPage={setPage} title="Payment Center"><PageHead title="Payment Center" subtitle="Manage buyer payment reviews and your payout profile."><div className="seller26__card" style={{padding:'10px 14px'}}><ShieldCheck size={16}/> Admin audit is the final authority.</div></PageHead><KpiCards list={[{label:'Pending Reviews',value:'3',trend:'Rp 6,850,000'},{label:'Verified Payments',value:'24',trend:'Rp 48,250,000'},{label:'Next Payout',value:'May 25 2025',trend:'Rp 14,250,000'},{label:'Profile Readiness',value:'85%',trend:'Almost ready'}]} /><div className="seller26__grid cols-2"><div className="seller26__card"><h3>Buyer Payment Review</h3>{['Budi Santoso','Sari Wulandari','Andi Pratama'].map((name,i)=><div className="seller26__card" key={name} style={{marginBottom:12}}><strong>{name}</strong><p>Invoice INV/2025/05/00{21-i} • Amount {['Rp 2,850,000','Rp 1,200,000','Rp 2,800,000'][i]}</p><div className="seller26__actions"><Button success>Approve Payment</Button><Button danger>Reject Payment</Button><Button>Request Recheck</Button></div></div>)}</div><div className="seller26__side-stack"><div className="seller26__card"><h3>Payout Profile <Pill>Active</Pill></h3><p>Bank BCA • Rizky Pratama • 1234 5678 9012</p><Button icon={Plus}>Add New Account</Button></div><div className="seller26__card"><h3>Document Verification</h3>{['ID Card','Tax Number','Bank Ownership Proof','Selfie with ID'].map(x=><p key={x}><Pill>Verified</Pill> {x}</p>)}</div><div className="seller26__card"><h3>Payout Method</h3><p>Schedule: Weekly<br/>Minimum threshold: Rp 100,000<br/>Method: Bank Transfer</p><Button primary>Update Profile</Button></div></div></div></Shell>;
}

function CouponsPage({ setPage }) {
  return <Shell page="coupons" setPage={setPage} title="Coupons & Promotions"><PageHead title="Coupons & Promotions" subtitle="Manage store coupons, campaigns, and promotion performance."><Button icon={BarChart3}>View Performance</Button><Button icon={Gift}>New Campaign</Button><Button primary icon={Plus}>Create Coupon</Button></PageHead><KpiCards list={[{label:'Active Coupons',value:'24',trend:'+20%'},{label:'Scheduled Campaigns',value:'6',trend:'+15%'},{label:'Total Redeem',value:'3,624',trend:'+28%'},{label:'Attributed Revenue',value:'Rp 128,450,000',trend:'+34%'}]} /><div className="seller26__grid" style={{gridTemplateColumns:'1fr 320px'}}><div><div className="seller26__tabs">{['All Coupons','Store Coupons','Platform Coupons','Campaigns'].map((x,i)=><button className={i===0?'is-active':''} key={x}>{x}</button>)}</div><div className="seller26__card"><table className="seller26__table"><thead><tr><th>Code</th><th>Scope</th><th>Discount Type</th><th>Validity</th><th>Min Purchase</th><th>Usage</th><th>Attribution</th><th>Status</th></tr></thead><tbody>{coupons.map(coupon=><tr key={coupon.code}><td><Pill tone="purple">{coupon.code}</Pill></td><td>{coupon.scope}</td><td>{coupon.type}</td><td>{coupon.validity}</td><td>{coupon.min}</td><td>{coupon.usage}</td><td>{coupon.attribution}</td><td><Pill tone={coupon.status==='Active'?'green':'gray'}>{coupon.status}</Pill></td></tr>)}</tbody></table></div><div className="seller26__grid cols-2" style={{marginTop:18}}><div className="seller26__card"><h3>Promotion Rules</h3><p>Maximum discount: 70%. Coupon stacking: one coupon per transaction. Customer usage: once per customer.</p></div><div className="seller26__card"><h3>Promotion Conflict Warnings</h3><p><Pill tone="orange">2 warnings</Pill> TOKOKU20 and MEGASALE25 overlap in electronics category.</p></div></div></div><div className="seller26__side-stack"><ChartCard title="Coupon Performance" value="3,624" /><div className="seller26__card"><h3>Top Coupons</h3>{coupons.map(c=><p key={c.code}>{c.code} — {c.usage}</p>)}</div><div className="seller26__card"><h3>Storefront Preview</h3><div className="seller26__storefront"><strong>Use TOKOKU20</strong><p>20% discount up to Rp 25,000.</p><Button primary>Claim</Button></div></div></div></div></Shell>;
}

function TeamPage({ setPage }) {
  return <Shell page="team" setPage={setPage} title="Team & Access"><PageHead title="Team & Access" subtitle="Manage team members, roles, permissions, and audit activity."><Button icon={ExternalLink}>View Full Audit</Button><Button icon={ShieldCheck}>Create Role</Button><Button primary icon={Plus}>Invite Member</Button></PageHead><div className="seller26__tabs">{['Team Members','Role & Permission','Audit Log'].map((x,i)=><button className={i===0?'is-active':''} key={x}>{x}</button>)}</div><KpiCards list={[{label:'Total Members',value:'12',trend:'8 active'},{label:'Pending Invites',value:'2',trend:'Waiting'},{label:'Active Roles',value:'4',trend:'Owner/Admin/Staff'},{label:'Access Changes',value:'16',trend:'7 days'}]} /><div className="seller26__grid" style={{gridTemplateColumns:'1fr 420px 320px'}}><div className="seller26__card"><h3>Team Members</h3><table className="seller26__table"><tbody>{team.map(member=><tr key={member.email}><td><div className="seller26__avatar-img">{member.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div></td><td><strong>{member.name}</strong><br/><small>{member.email}</small></td><td><Pill tone={member.role==='Owner'?'purple':'green'}>{member.role}</Pill></td><td>{member.scope}</td><td><Pill tone={member.status==='Active'?'green':'orange'}>{member.status}</Pill></td></tr>)}</tbody></table></div><div className="seller26__card"><h3>Role & Permission Matrix</h3><div className="seller26__matrix">{['Module','Owner','Admin','Staff','Support','Catalog','✓','✓','✓','×','Orders','✓','✓','✓','✓','Payment','✓','✓','×','✓','Coupons','✓','✓','×','×','Analytics','✓','✓','–','×'].map((x,i)=><div key={i} className={i<5?'head':''}>{x}</div>)}</div></div><div className="seller26__card"><h3>Latest Audit Activity</h3><div className="seller26__timeline">{['Member invitation sent','Role changed','Member disabled','Permission updated','Member joined'].map(x=><div className="seller26__timeline-item" key={x}><strong>{x}</strong><p>Today</p></div>)}</div></div></div></Shell>;
}

function AnalyticsPage({ setPage }) {
  return <Shell page="analytics" setPage={setPage} title="Analytics & Storefront Sync"><PageHead title="Analytics & Storefront Sync" subtitle="Track business performance and public channel synchronization."><Button icon={RefreshCw}>Sync Now</Button></PageHead><KpiCards list={[{label:'Total Revenue',value:'Rp 128,450,000',trend:'+18.6%'},{label:'Total Orders',value:'1,842',trend:'+14.3%'},{label:'Conversion Rate',value:'3.62%',trend:'+0.6pp'},{label:'AOV',value:'Rp 69,650',trend:'+7.8%'}]} /><div className="seller26__grid" style={{gridTemplateColumns:'1fr 360px'}}><div className="seller26__grid"><div className="seller26__grid cols-3"><ChartCard title="Revenue" value="Rp 128,450,000" /><ChartCard title="Orders" value="1,842" tone="#2563eb" /><ChartCard title="Conversion Rate" value="3.62%" tone="#f97316" /></div><div className="seller26__grid cols-2"><div className="seller26__card"><h3>Top Product Performance</h3><table className="seller26__table"><tbody>{products.slice(0,5).map((p,i)=><tr key={p.sku}><td>{i+1}</td><td>{p.name}</td><td>{(12460 - i*1200).toLocaleString()}</td><td>{(6.72 - i*.7).toFixed(2)}%</td><td>Rp {(24560000 - i*2100000).toLocaleString('id-ID')}</td></tr>)}</tbody></table></div><div className="seller26__card"><h3>Channel Performance</h3><div className="seller26__donut" />{['Microsite 37.8%','Tokopedia 25.2%','Shopee 18.8%','TikTok Shop 10.3%','Others 7.7%'].map(x=><p key={x}>{x}</p>)}</div></div><div className="seller26__card"><h3>Storefront Sync Control Center</h3><div className="seller26__grid cols-3">{syncChannels.map(channel=><div className="seller26__card" key={channel.name}><Globe2 size={18}/><h3>{channel.name}</h3><Pill tone={channel.status==='Synced'?'green':'orange'}>{channel.status}</Pill><p>{channel.lastSync}<br/>Health: {channel.health}</p></div>)}</div></div></div><div className="seller26__side-stack"><div className="seller26__card"><h3>Your Public Store Preview <Pill>Live</Pill></h3><div className="seller26__storefront"><strong>Best Technology for Easier Living</strong><p>Original products, best price, official warranty.</p><Button primary>Shop Now</Button></div><div className="seller26__phone"><div className="seller26__phone-screen"><strong>TOKOKU DIGITAL</strong><p>Popular Categories</p><div className="seller26__spark" /></div></div></div><div className="seller26__card"><h3>Public Store Status</h3>{['Store Logo Active','Main Banner Active','Slug / Domain Active','Published Products 318/320','Coupon Banner Active','SSL & Security Safe','Analytics Tracking Active'].map(x=><p key={x}><Pill>OK</Pill> {x}</p>)}</div><div className="seller26__card"><h3>Insights & Recommendations</h3><p>Wireless Headphone Pro has the highest conversion. Microsite contributes 37.8% of revenue. Optimize promo banner for stronger conversion.</p></div></div></div></Shell>;
}

export default function SellerWorkspace2026({ initialPage = 'overview' }) {
  const [page, setPage] = useState(initialPage);
  const normalized = useMemo(() => page || 'overview', [page]);
  if (normalized === 'profile') return <StoreProfilePage setPage={setPage} />;
  if (normalized === 'catalog') return <CatalogPage setPage={setPage} />;
  if (normalized === 'authoring') return <ProductAuthoringPage setPage={setPage} />;
  if (normalized === 'review') return <ProductReviewPage setPage={setPage} />;
  if (normalized === 'orders') return <OrdersPage setPage={setPage} />;
  if (normalized === 'payment') return <PaymentPage setPage={setPage} />;
  if (normalized === 'coupons') return <CouponsPage setPage={setPage} />;
  if (normalized === 'team') return <TeamPage setPage={setPage} />;
  if (normalized === 'analytics') return <AnalyticsPage setPage={setPage} />;
  return <OverviewPage setPage={setPage} />;
}
