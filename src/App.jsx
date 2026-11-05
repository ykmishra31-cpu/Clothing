import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, ShoppingBag, Check, ChevronDown, ChevronLeft,
  ChevronRight, CircleUserRound, Clock3, Instagram, Menu, Minus, Package,
  Plus, Search, ShieldCheck, SlidersHorizontal, Truck, X, Zap
} from "lucide-react";
import { categories, seedProducts } from "./data";
import { supabase, isConnected } from "./supabase";

const money = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const ORDER_KEY = "tryy_angle_orders_v1";
const CART_KEY = "tryy_angle_cart_v1";
const PRODUCT_KEY = "tryy_angle_products_v1";
const uid = () => `TA${Date.now().toString().slice(-7)}${Math.floor(Math.random()*90+10)}`;

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function useStore() {
  const [products, setProducts] = useState(() => read(PRODUCT_KEY, seedProducts));
  const [cart, setCart] = useState(() => read(CART_KEY, []));
  const [orders, setOrders] = useState(() => read(ORDER_KEY, []));
  useEffect(() => localStorage.setItem(PRODUCT_KEY, JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem(CART_KEY, JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem(ORDER_KEY, JSON.stringify(orders)), [orders]);
  return { products, setProducts, cart, setCart, orders, setOrders };
}

function Header({ count, onCart, onSearch, onAdmin }) {
  const [open, setOpen] = useState(false);
  return <>
    <div className="topline">FREE SHIPPING ON ORDERS ABOVE ₹1,999 <span>·</span> YOUR STYLE, YOUR ANGLE</div>
    <header className="header">
      <button className="icon-btn mobile-menu" onClick={() => setOpen(!open)} aria-label="Open menu"><Menu /></button>
      <a href="#home" className="wordmark"><img src="/tryy-angle-logo.svg" alt="TRYy ANGLE" /></a>
      <nav className={open ? "nav nav-open" : "nav"}>
        <a href="#shop" onClick={() => setOpen(false)}>SHOP ALL</a>
        <a href="#shop" onClick={() => setOpen(false)}>NEW ARRIVALS</a>
        <a href="#story" onClick={() => setOpen(false)}>OUR STORY</a>
        <a href="#track" onClick={() => setOpen(false)}>TRACK ORDER</a>
      </nav>
      <div className="header-actions">
        <button className="icon-btn" onClick={onSearch} aria-label="Search"><Search /></button>
        <button className="icon-btn admin-shortcut" onClick={onAdmin} aria-label="Admin"><ShieldCheck /></button>
        <button className="bag-btn" onClick={onCart}><ShoppingBag size={17}/> <span>BAG</span><b>{count}</b></button>
      </div>
    </header>
  </>;
}

function ProductCard({ product, onSelect, index }) {
  return <motion.article className="product-card" initial={{opacity:0,y:22}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.12}} transition={{delay:index*.045,duration:.5}}>
    <button className="product-visual" onClick={() => onSelect(product)}>
      <img src={product.image} alt={product.name} loading="lazy"/>
      <span className="product-badge">{product.badge || "TRYy ANGLE"}</span>
      <span className="quick-view">QUICK VIEW <ArrowUpRight size={14}/></span>
    </button>
    <div className="product-meta">
      <div><h3>{product.name}</h3><p>{product.category} · Relaxed fit</p></div>
      <div className="price"><b>{money(product.price)}</b>{product.oldPrice > product.price && <del>{money(product.oldPrice)}</del>}</div>
    </div>
  </motion.article>;
}

function ProductModal({ product, onClose, onAdd }) {
  const [size, setSize] = useState(product?.sizes?.[1] || product?.sizes?.[0] || "M");
  const [color, setColor] = useState(product?.colors?.[0] || "Black");
  if (!product) return null;
  return <div className="overlay" onMouseDown={onClose}>
    <motion.div className="product-modal" initial={{opacity:0,y:25,scale:.98}} animate={{opacity:1,y:0,scale:1}} onMouseDown={e=>e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}><X/></button>
      <img src={product.image} alt={product.name}/>
      <div className="modal-info">
        <span className="eyebrow">{product.category} / TRYy ANGLE</span><h2>{product.name}</h2>
        <div className="modal-price">{money(product.price)} {product.oldPrice>product.price&&<del>{money(product.oldPrice)}</del>}</div>
        <p>{product.description}</p>
        <label className="field-label">COLOUR — {color}</label>
        <div className="swatches">{product.colors.map(c=><button key={c} className={color===c?"swatch active":"swatch"} onClick={()=>setColor(c)}>{c}</button>)}</div>
        <label className="field-label">SELECT SIZE — {size}</label>
        <div className="sizes">{product.sizes.map(s=><button key={s} className={size===s?"size active":"size"} onClick={()=>setSize(s)}>{s}</button>)}</div>
        <button className="primary-btn full" onClick={()=>onAdd(product,size,color)}>ADD TO BAG <ArrowUpRight size={17}/></button>
        <div className="micro-perks"><span><Truck size={15}/> Manual dispatch updates</span><span><ShieldCheck size={15}/> Secure order record</span></div>
      </div>
    </motion.div>
  </div>;
}

function CartDrawer({ cart, onClose, onChange, onCheckout }) {
  const subtotal = cart.reduce((s,x)=>s+x.price*x.qty,0);
  const shipping = subtotal >= 1999 || subtotal===0 ? 0 : 79;
  return <div className="overlay drawer-overlay" onMouseDown={onClose}>
    <motion.aside className="cart-drawer" initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{type:"spring",damping:28}} onMouseDown={e=>e.stopPropagation()}>
      <div className="drawer-head"><div><span className="eyebrow">YOUR SELECTION</span><h2>Shopping bag <small>({cart.reduce((s,x)=>s+x.qty,0)})</small></h2></div><button className="icon-btn" onClick={onClose}><X/></button></div>
      <div className="cart-items">
        {cart.length===0?<div className="empty-state"><ShoppingBag size={36}/><h3>Your bag is waiting.</h3><p>Find something that feels like you.</p></div>:cart.map(item=><div className="cart-line" key={`${item.id}-${item.size}-${item.color}`}>
          <img src={item.image} alt={item.name}/><div className="cart-line-info"><h3>{item.name}</h3><p>{item.color} / {item.size}</p><b>{money(item.price)}</b><div className="qty"><button onClick={()=>onChange(item,-1)}><Minus size={13}/></button><span>{item.qty}</span><button onClick={()=>onChange(item,1)}><Plus size={13}/></button></div></div>
          <button className="remove" onClick={()=>onChange(item,-item.qty)}>REMOVE</button>
        </div>)}
      </div>
      <div className="cart-summary"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Shipping</span><b>{shipping===0?"FREE":money(shipping)}</b></div><p>{subtotal<1999&&subtotal>0?`Add ${money(1999-subtotal)} more for free shipping.`:"Shipping offer applied where eligible."}</p><div className="total"><span>Estimated total</span><b>{money(subtotal+shipping)}</b></div><button className="primary-btn full" disabled={!cart.length} onClick={onCheckout}>PROCEED TO CHECKOUT <ArrowRight size={17}/></button><small>Taxes, if applicable, are included in the displayed price.</small></div>
    </motion.aside>
  </div>;
}

function Checkout({ cart, onClose, onPlace }) {
  const [form,setForm]=useState({name:"",phone:"",email:"",address:"",city:"",state:"",pincode:"",notes:""});
  const [busy,setBusy]=useState(false);
  const subtotal=cart.reduce((s,x)=>s+x.price*x.qty,0);
  const shipping=subtotal>=1999?0:79;
  const update=(k,v)=>setForm(f=>({...f,[k]:v}));
  async function submit(e){e.preventDefault();setBusy(true);await onPlace(form,subtotal,shipping);setBusy(false);}
  return <div className="overlay" onMouseDown={onClose}><motion.div className="checkout-modal" initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} onMouseDown={e=>e.stopPropagation()}>
    <button className="modal-close" onClick={onClose}><X/></button><div className="checkout-top"><span className="eyebrow">FINAL STEP / YOUR DETAILS</span><h2>Make it yours.</h2><p>Fill in your delivery details. Our team will confirm your order and dispatch manually.</p></div>
    <form onSubmit={submit} className="checkout-form">
      <div className="form-grid"><label>FULL NAME<input required value={form.name} onChange={e=>update("name",e.target.value)} placeholder="Your name"/></label><label>PHONE NUMBER<input required pattern="[0-9]{10}" value={form.phone} onChange={e=>update("phone",e.target.value)} placeholder="10-digit mobile number"/></label><label>EMAIL ADDRESS<input type="email" value={form.email} onChange={e=>update("email",e.target.value)} placeholder="you@email.com"/></label><label>PINCODE<input required pattern="[0-9]{6}" value={form.pincode} onChange={e=>update("pincode",e.target.value)} placeholder="6-digit pincode"/></label></div>
      <label>FULL DELIVERY ADDRESS<textarea required rows="3" value={form.address} onChange={e=>update("address",e.target.value)} placeholder="House no., street, landmark"/></label>
      <div className="form-grid"><label>CITY<input required value={form.city} onChange={e=>update("city",e.target.value)} placeholder="City"/></label><label>STATE<input required value={form.state} onChange={e=>update("state",e.target.value)} placeholder="State"/></label></div>
      <label>ORDER NOTE <span className="optional">OPTIONAL</span><textarea rows="2" value={form.notes} onChange={e=>update("notes",e.target.value)} placeholder="Any delivery instructions?"/></label>
      <div className="checkout-total"><span>Order total</span><b>{money(subtotal+shipping)}</b></div>
      <button className="primary-btn full" disabled={busy}>{busy?"PLACING ORDER…":"PLACE ORDER · "+money(subtotal+shipping)} <ArrowUpRight size={17}/></button>
      <p className="form-disclaimer">By placing this order, you confirm that the delivery details are correct. Payment and courier coordination will be handled separately.</p>
    </form>
  </motion.div></div>;
}

function AdminPanel({ orders, setOrders, products, setProducts, onExit }) {
  const [tab,setTab]=useState("orders");
  const [selected,setSelected]=useState(null);
  const [edit,setEdit]=useState({});
  const [adminLogged,setAdminLogged]=useState(!isConnected);
  const [login,setLogin]=useState({email:"",password:""});
  const [authError,setAuthError]=useState("");
  const [search,setSearch]=useState("");
  const [productForm,setProductForm]=useState({name:"",category:"T-Shirts",price:"",stock:"",image:"",description:"",sizes:"S,M,L,XL",colors:"Black,Bone"});
  async function signIn(e){e.preventDefault();const {data,error}=await supabase.auth.signInWithPassword(login);if(error){setAuthError(error.message);return;}if(data.user?.app_metadata?.role!=="admin"){await supabase.auth.signOut();setAuthError("This account does not have admin access.");return;}setAdminLogged(true);}
  async function saveOrder(){const next=orders.map(o=>o.id===selected.id?{...o,...edit}:o);setOrders(next);if(isConnected){const {error}=await supabase.from("orders").update({status:edit.status||selected.status,courier:edit.courier??selected.courier,tracking_number:edit.tracking_number??selected.tracking_number,admin_note:edit.admin_note??selected.admin_note}).eq("order_number",selected.id);if(error)alert(error.message);}setSelected(null);}
  async function addProduct(e){e.preventDefault();const p={...productForm,id:`ta-${Date.now()}`,price:Number(productForm.price),stock:Number(productForm.stock),sizes:productForm.sizes.split(",").map(x=>x.trim()),colors:productForm.colors.split(",").map(x=>x.trim()),oldPrice:Number(productForm.price),badge:"NEW",featured:false};setProducts([p,...products]);if(isConnected){const {error}=await supabase.from("products").insert({sku:p.id,name:p.name,category:p.category,price:p.price,stock:p.stock,image_url:p.image,description:p.description,sizes:p.sizes,colors:p.colors,active:true});if(error)alert("Saved in this browser, database error: "+error.message);}setProductForm({name:"",category:"T-Shirts",price:"",stock:"",image:"",description:"",sizes:"S,M,L,XL",colors:"Black,Bone"});}
  if(!adminLogged)return <div className="admin-login"><form onSubmit={signIn}><span className="eyebrow">TRYy ANGLE / PRIVATE ACCESS</span><h2>Admin sign in</h2><p>Sign in with an account assigned the admin role.</p><label>EMAIL<input type="email" required value={login.email} onChange={e=>setLogin({...login,email:e.target.value})}/></label><label>PASSWORD<input type="password" required value={login.password} onChange={e=>setLogin({...login,password:e.target.value})}/></label>{authError&&<p className="error">{authError}</p>}<button className="primary-btn full">SIGN IN <ArrowRight size={16}/></button></form></div>;
  const filtered=orders.filter(o=>`${o.id} ${o.customer?.name} ${o.customer?.phone}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="admin-shell">
    <aside className="admin-sidebar"><a className="wordmark" href="#home"><img src="/tryy-angle-logo.svg" alt="TRYy ANGLE"/></a><span className="admin-label">CONTROL CENTRE</span>{[["orders","Orders",Package],["products","Products",ShoppingBag],["shipping","Shipping desk",Truck]].map(([key,label,Icon])=><button key={key} className={tab===key?"admin-nav active":"admin-nav"} onClick={()=>setTab(key)}><Icon size={17}/>{label}{key==="orders"&&<b>{orders.filter(o=>o.status!=="Delivered").length}</b>}</button>)}<button className="admin-exit" onClick={onExit}>← BACK TO STORE</button></aside>
    <main className="admin-main"><div className="admin-top"><div><span className="eyebrow">TRYy ANGLE / ADMIN</span><h1>{tab==="orders"?"Orders":tab==="products"?"Products":"Shipping desk"}</h1></div><span className="live-pill"><i/> {isConnected?"CONNECTED":"DEMO MODE"}</span></div>
      <div className="admin-stats"><div><span>TOTAL ORDERS</span><b>{orders.length}</b></div><div><span>TO PROCESS</span><b>{orders.filter(o=>!["Delivered","Cancelled"].includes(o.status)).length}</b></div><div><span>REVENUE</span><b>{money(orders.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+o.total,0))}</b></div><div><span>PRODUCTS</span><b>{products.length}</b></div></div>
      {tab==="orders"&&<><div className="admin-toolbar"><h2>All orders <small>({orders.length})</small></h2><input placeholder="Search order, name or phone…" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="admin-table-wrap"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>ITEMS</th><th>TOTAL</th><th>STATUS</th><th></th></tr></thead><tbody>{filtered.map(o=><tr key={o.id}><td><b>#{o.id}</b></td><td>{o.customer?.name}<small>{o.customer?.phone}</small></td><td>{new Date(o.createdAt).toLocaleDateString("en-IN")}</td><td>{o.items?.reduce((s,x)=>s+x.qty,0)||0}</td><td><b>{money(o.total)}</b></td><td><span className={`status ${o.status?.toLowerCase().replaceAll(" ","-")}`}>{o.status}</span></td><td><button className="table-action" onClick={()=>{setSelected(o);setEdit({...o});}}>VIEW / UPDATE ↗</button></td></tr>)}</tbody></table>{filtered.length===0&&<div className="empty-admin">No orders yet. New customer orders will appear here.</div>}</div></>}
      {tab==="shipping"&&<div className="shipping-list"><p>Manual shipping only. Update courier and tracking details from each order.</p>{orders.map(o=><button className="shipping-row" key={o.id} onClick={()=>{setSelected(o);setEdit({...o});}}><div><b>#{o.id} · {o.customer?.name}</b><span>{o.customer?.city}, {o.customer?.pincode}</span></div><div><b>{o.courier||"Courier not assigned"}</b><span>{o.tracking_number||"Tracking number pending"}</span></div><span className={`status ${o.status?.toLowerCase().replaceAll(" ","-")}`}>{o.status}</span><ArrowUpRight/></button>)}</div>}
      {tab==="products"&&<div className="products-admin"><form className="product-create" onSubmit={addProduct}><h2>Add a product</h2><label>PRODUCT NAME<input required value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value})}/></label><div className="form-grid"><label>CATEGORY<select value={productForm.category} onChange={e=>setProductForm({...productForm,category:e.target.value})}>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select></label><label>PRICE (₹)<input required type="number" min="1" value={productForm.price} onChange={e=>setProductForm({...productForm,price:e.target.value})}/></label><label>STOCK<input required type="number" min="0" value={productForm.stock} onChange={e=>setProductForm({...productForm,stock:e.target.value})}/></label><label>IMAGE URL<input value={productForm.image} onChange={e=>setProductForm({...productForm,image:e.target.value})}/></label></div><label>DESCRIPTION<textarea value={productForm.description} onChange={e=>setProductForm({...productForm,description:e.target.value})}/></label><div className="form-grid"><label>SIZES (comma separated)<input value={productForm.sizes} onChange={e=>setProductForm({...productForm,sizes:e.target.value})}/></label><label>COLOURS (comma separated)<input value={productForm.colors} onChange={e=>setProductForm({...productForm,colors:e.target.value})}/></label></div><button className="primary-btn">ADD PRODUCT <Plus size={16}/></button></form><div className="admin-product-list"><h2>Catalogue <small>({products.length})</small></h2>{products.map(p=><div className="admin-product" key={p.id}><img src={p.image} alt=""/><div><b>{p.name}</b><span>{p.category} · {money(p.price)} · Stock {p.stock}</span></div><button onClick={()=>setProducts(products.filter(x=>x.id!==p.id))}>REMOVE</button></div>)}</div></div>}
    </main>
    {selected&&<div className="overlay" onMouseDown={()=>setSelected(null)}><div className="order-modal" onMouseDown={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelected(null)}><X/></button><span className="eyebrow">ORDER DETAILS</span><h2>#{selected.id}</h2><div className="order-customer"><b>{selected.customer?.name}</b><span>{selected.customer?.phone} · {selected.customer?.email}</span><span>{selected.customer?.address}, {selected.customer?.city}, {selected.customer?.state} — {selected.customer?.pincode}</span></div><h3>Items</h3>{selected.items?.map((x,i)=><div className="order-item" key={i}><span>{x.name} · {x.size} / {x.color} × {x.qty}</span><b>{money(x.price*x.qty)}</b></div>)}<div className="order-item"><span>Shipping</span><b>{money(selected.shipping)}</b></div><div className="form-grid"><label>ORDER STATUS<select value={edit.status||selected.status} onChange={e=>setEdit({...edit,status:e.target.value})}>{["New","Confirmed","Packed","Shipped","Out for Delivery","Delivered","Cancelled"].map(s=><option key={s}>{s}</option>)}</select></label><label>COURIER NAME<input value={edit.courier||""} onChange={e=>setEdit({...edit,courier:e.target.value})} placeholder="e.g. Delhivery"/></label><label>TRACKING NUMBER<input value={edit.tracking_number||""} onChange={e=>setEdit({...edit,tracking_number:e.target.value})} placeholder="Enter AWB / tracking ID"/></label><label>ADMIN NOTE<input value={edit.admin_note||""} onChange={e=>setEdit({...edit,admin_note:e.target.value})} placeholder="Internal note"/></label></div><button className="primary-btn full" onClick={saveOrder}>SAVE ORDER UPDATE <Check size={17}/></button></div></div>}
    </div>;
}

export default function App() {
  const store=useStore();
  const [category,setCategory]=useState("All");
  const [sort,setSort]=useState("featured");
  const [query,setQuery]=useState("");
  const [searchOpen,setSearchOpen]=useState(false);
  const [selected,setSelected]=useState(null);
  const [cartOpen,setCartOpen]=useState(false);
  const [checkout,setCheckout]=useState(false);
  const [admin,setAdmin]=useState(location.pathname==="/admin");
  const [toast,setToast]=useState("");
  const [tracking,setTracking]=useState({id:"",phone:""});
  const [tracked,setTracked]=useState(null);
  useEffect(()=>{const onPop=()=>setAdmin(location.pathname==="/admin");window.addEventListener("popstate",onPop);return()=>window.removeEventListener("popstate",onPop);},[]);
  function goAdmin(){history.pushState({},"","/admin");setAdmin(true);window.scrollTo(0,0);}
  function exitAdmin(){history.pushState({},"","/");setAdmin(false);window.scrollTo(0,0);}
  function notify(t){setToast(t);setTimeout(()=>setToast(""),2800);}
  const visible=useMemo(()=>store.products.filter(p=>(category==="All"||p.category===category)&&`${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==="price-low"?a.price-b.price:sort==="price-high"?b.price-a.price:sort==="new"?b.id.localeCompare(a.id):(Number(b.featured)-Number(a.featured))),[store.products,category,query,sort]);
  function addToCart(product,size,color){store.setCart(c=>{const idx=c.findIndex(x=>x.id===product.id&&x.size===size&&x.color===color);if(idx>=0)return c.map((x,i)=>i===idx?{...x,qty:x.qty+1}:x);return [...c,{...product,size,color,qty:1}];});setSelected(null);notify("Added to your bag.");}
  function changeCart(item,delta){store.setCart(c=>c.map(x=>x.id===item.id&&x.size===item.size&&x.color===item.color?{...x,qty:x.qty+delta}:x).filter(x=>x.qty>0));}
  async function placeOrder(customer,subtotal,shipping){
    const order={id:uid(),createdAt:new Date().toISOString(),status:"New",customer,items:store.cart.map(({id,name,price,size,color,qty})=>({id,name,price,size,color,qty})),subtotal,shipping,total:subtotal+shipping,courier:"",tracking_number:"",admin_note:""};
    if(isConnected){
      const {data:auth}=await supabase.auth.getUser();
      const {error}=await supabase.from("orders").insert({order_number:order.id,customer_name:customer.name,phone:customer.phone,email:customer.email,address:customer.address,city:customer.city,state:customer.state,pincode:customer.pincode,notes:customer.notes,items:order.items,subtotal,shipping,total:order.total,status:"New",user_id:auth.user?.id||null});
      if(error){notify("Order could not be saved: "+error.message);return;}
    }
    store.setOrders(o=>[order,...o]);store.setCart([]);setCheckout(false);setCartOpen(false);notify(`Order placed! Your order ID is ${order.id}`);setTracked(order);
  }
  async function lookupOrder(e){e.preventDefault();if(isConnected){const {data,error}=await supabase.from("orders").select("*").eq("order_number",tracking.id.trim()).eq("phone",tracking.phone.trim()).maybeSingle();if(error){notify(error.message);return;}setTracked(data?{id:data.order_number,status:data.status,courier:data.courier,tracking_number:data.tracking_number,customer:{name:data.customer_name}}:null);}else setTracked(store.orders.find(o=>o.id===tracking.id.trim()&&o.customer.phone===tracking.phone.trim())||null);}
  if(admin)return <AdminPanel {...store} onExit={exitAdmin}/>;
  return <div className="app">
    <Header count={store.cart.reduce((s,x)=>s+x.qty,0)} onCart={()=>setCartOpen(true)} onSearch={()=>{setSearchOpen(!searchOpen);document.getElementById("shop")?.scrollIntoView({behavior:"smooth"});}} onAdmin={goAdmin}/>
    {searchOpen&&<div className="search-strip"><Search/><input autoFocus placeholder="Search the collection…" value={query} onChange={e=>setQuery(e.target.value)}/><button onClick={()=>{setSearchOpen(false);setQuery("");}}><X/></button></div>}
    <main id="home">
      <section className="hero">
        <div className="hero-backdrop">TA<span>®</span></div>
        <div className="hero-copy"><span className="eyebrow"><i/> NEW SEASON / NEW PERSPECTIVE</span><h1>MAKE YOUR<br/><em>OWN ANGLE.</em></h1><p>Not made to fit in. Made to feel like you. Discover everyday streetwear with a point of view.</p><a href="#shop" className="hero-cta">EXPLORE THE DROP <ArrowDownRight size={18}/></a><div className="hero-foot"><span>01 — 08 / THE NEW COLLECTION</span><span>EST. FOR EVERY ANGLE</span></div></div>
        <div className="hero-visual"><div className="hero-ring ring-one"/><div className="hero-ring ring-two"/><div className="hero-photo-wrap"><img src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1300&q=90" alt="TRYy ANGLE streetwear collection"/></div><div className="floating-stamp"><span>YOUR</span><b>ANGLE</b><small>NO RULES / JUST YOU</small></div><div className="vertical-note">CLOTHING / CULTURE / EVERYDAY</div></div>
      </section>
      <div className="ticker"><div>FIND YOUR FIT ✳ WEAR YOUR ANGLE ✳ STREETWEAR WITHOUT RULES ✳ FIND YOUR FIT ✳ WEAR YOUR ANGLE ✳</div></div>
      <section className="shop-section section-pad" id="shop"><div className="section-heading"><div><span className="eyebrow">01 / THE COLLECTION</span><h2>Find your <em>fit.</em></h2></div><p>Pieces for the everyday. Designed to move with you, wherever your angle takes you.</p></div>
        <div className="shop-controls"><div className="category-tabs">{categories.map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div><label className="sort-select"><SlidersHorizontal size={15}/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="new">New arrivals</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select><ChevronDown size={14}/></label></div>
        <div className="product-grid">{visible.map((p,i)=><ProductCard key={p.id} product={p} index={i} onSelect={setSelected}/>)}</div>{visible.length===0&&<div className="empty-state">No pieces found. Try another search.</div>}
      </section>
      <section className="manifesto" id="story"><div className="manifesto-image"><img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1300&q=85" alt="Streetwear editorial"/><span>TA / 001</span></div><div className="manifesto-copy"><span className="eyebrow">02 / OUR POINT OF VIEW</span><h2>THE WORLD<br/>DOESN'T NEED<br/>ANOTHER <em>YOU.</em></h2><p>It needs the real one. TRYy ANGLE is built around the idea that style is personal. No uniform, no permission, no one-size-fits-all point of view. Just pieces that let you show up as yourself.</p><a href="#shop" className="text-link">FIND YOUR ANGLE <ArrowUpRight size={17}/></a></div></section>
      <section className="benefits"><div><Zap/><b>MADE TO MOVE</b><span>Comfort-led everyday fits.</span></div><div><Package/><b>CAREFULLY PACKED</b><span>Every order handled with care.</span></div><div><Truck/><b>MANUAL DISPATCH</b><span>Tracking shared after shipping.</span></div><div><ShieldCheck/><b>ORDER SUPPORT</b><span>Help when you need it.</span></div></section>
      <section className="track-section section-pad" id="track"><div><span className="eyebrow">03 / AFTER THE DROP</span><h2>Where's your<br/><em>order?</em></h2><p>Enter your order number and the phone number used at checkout.</p></div><form onSubmit={lookupOrder}><label>ORDER NUMBER<input required value={tracking.id} onChange={e=>setTracking({...tracking,id:e.target.value})} placeholder="e.g. TA123456789"/></label><label>PHONE NUMBER<input required value={tracking.phone} onChange={e=>setTracking({...tracking,phone:e.target.value})} placeholder="10-digit mobile number"/></label><button className="primary-btn">TRACK ORDER <ArrowUpRight size={16}/></button>{tracked&&<div className="tracking-result"><b>#{tracked.id||tracked.order_number}</b><span className={`status ${tracked.status?.toLowerCase().replaceAll(" ","-")}`}>{tracked.status}</span><p>{tracked.courier?`${tracked.courier} · ${tracked.tracking_number||"Tracking pending"}`:"Your order is in our system. Courier details will appear after dispatch."}</p></div>}</form></section>
      <section className="newsletter"><span className="eyebrow">04 / STAY IN THE LOOP</span><h2>GET THE FIRST<br/><em>LOOK.</em></h2><p>New drops, fresh fits and the occasional good thing. No noise.</p><form onSubmit={e=>{e.preventDefault();notify("You're on the list. Stay tuned.");e.currentTarget.reset();}}><input type="email" required placeholder="Your email address"/><button>JOIN THE LIST <ArrowUpRight size={16}/></button></form></section>
    </main>
    <footer className="footer"><div className="footer-top"><div><a href="#home" className="wordmark"><img src="/tryy-angle-logo.svg" alt="TRYy ANGLE"/></a><p>WEAR YOUR ANGLE.<br/>CLOTHING FOR YOUR OWN POINT OF VIEW.</p></div><div className="footer-links"><div><b>EXPLORE</b><a href="#shop">Shop all</a><a href="#story">Our story</a><a href="#track">Track order</a></div><div><b>CONNECT</b><a href="mailto:hello@tryyangle.com">Email us</a><a href="#home">Instagram ↗</a><a href="/admin">Admin</a></div></div></div><div className="footer-bottom"><span>© 2026 TRYy ANGLE. ALL RIGHTS RESERVED.</span><span>BUILT FOR EVERY ANGLE ✳</span></div></footer>
    <AnimatePresence>{cartOpen&&<CartDrawer cart={store.cart} onClose={()=>setCartOpen(false)} onChange={changeCart} onCheckout={()=>{setCartOpen(false);setCheckout(true);}}/>}</AnimatePresence>
    <AnimatePresence>{selected&&<ProductModal product={selected} onClose={()=>setSelected(null)} onAdd={addToCart}/>}</AnimatePresence>
    {checkout&&<Checkout cart={store.cart} onClose={()=>setCheckout(false)} onPlace={placeOrder}/>}
    {toast&&<div className="toast"><Check size={16}/>{toast}</div>}
    <div className="demo-note">{isConnected?"LIVE STORE":"PREVIEW MODE"}</div>
  </div>;
}