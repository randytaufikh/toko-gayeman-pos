import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

// Data default produk Racikin (Langsung tertanam otomatis di aplikasi)
const DEFAULT_PRODUCTS = [
  { id: 1, name: "Sayur Bayam", price: 5000, category: "Paket Ekonomis" },
  { id: 2, name: "Tumis Kangkung", price: 5000, category: "Paket Ekonomis" },
  { id: 3, name: "Tumis Sawi Hijau", price: 5000, category: "Paket Ekonomis" },
  { id: 4, name: "Tumis Sawi Putih", price: 5000, category: "Paket Ekonomis" },
  { id: 5, name: "Sayur Sop", price: 8000, category: "Paket Ekonomis" },
  { id: 6, name: "Capcay", price: 8000, category: "Paket Ekonomis" },
  { id: 7, name: "Tumis Labu Tempe", price: 8000, category: "Paket Ekonomis" },
  { id: 8, name: "Tumis Toge Tempe", price: 8000, category: "Paket Ekonomis" },
  { id: 9, name: "Tumis Buncis Tempe", price: 8000, category: "Paket Ekonomis" },
  { id: 10, name: "Tumis Kacang Pjg Tempe", price: 8000, category: "Paket Ekonomis" },
  { id: 11, name: "Tumis Buncis", price: 8000, category: "Paket Ekonomis" },
  { id: 12, name: "Tumis Sawi Hijau Jagung", price: 8000, category: "Paket Ekonomis" },
  { id: 13, name: "Tumis Sawi Hijau Tahu", price: 8000, category: "Paket Ekonomis" },
  { id: 14, name: "Tumis Sawi Putih Tahu", price: 8000, category: "Paket Ekonomis" },
  { id: 15, name: "Tumis Pakcoy Tahu", price: 8000, category: "Paket Ekonomis" },
  { id: 16, name: "Tumis Toge Tahu", price: 8000, category: "Paket Ekonomis" },
  { id: 17, name: "Cabe Rawit Ekonomis", price: 10000, category: "Paket Ekonomis" },
  { id: 18, name: "Cabe & Tomat Ekonomis", price: 10000, category: "Paket Ekonomis" },
  { id: 19, name: "Sambal Ekonomis", price: 10000, category: "Paket Ekonomis" },
  { id: 20, name: "Sayur Asem", price: 12000, category: "Paket Premium" },
  { id: 21, name: "Sayur Lodeh", price: 12000, category: "Paket Premium" },
  { id: 22, name: "Sop Ayam Bening", price: 15000, category: "Paket Premium" },
  { id: 23, name: "Soto Ayam", price: 15000, category: "Paket Premium" },
  { id: 24, name: "Tumis Daging Sapi Iris", price: 25000, category: "Paket Signature" },
  { id: 25, name: "Ayam Goreng Lengkuas", price: 20000, category: "Paket Signature" }
];

export default function App() {
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('gayeman_products');
      return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  });

  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isManageOpen, setIsManageOpen] = useState(false);
  
  const receiptRef = useRef();

  useEffect(() => {
    try {
      localStorage.setItem('gayeman_products', JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);

  const categories = ['Semua', ...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopyWhatsApp = () => {
    if (cart.length === 0) {
      alert('Keranjang masih kosong!');
      return;
    }

    let text = `*TOKO GAYEMAN.QU*\nBukit Ayana Ciomas Blok B2/30\n`;
    text += `-----------------------------------\n`;
    text += `Pelanggan: *${customerName || 'Umum'}*\n`;
    text += `Waktu: ${new Date().toLocaleString('id-ID')}\n`;
    text += `-----------------------------------\n\n`;

    cart.forEach((item, idx) => {
      const itemPrice = Number(item.price) || 0;
      const itemQty = Number(item.qty) || 0;
      text += `${idx + 1}. ${item.name}\n`;
      text += `   ${itemQty}x @Rp ${itemPrice.toLocaleString('id-ID')} = *Rp ${(itemPrice * itemQty).toLocaleString('id-ID')}*\n`;
    });

    text += `\n-----------------------------------\n`;
    text += `*TOTAL: Rp ${totalAmount.toLocaleString('id-ID')}*\n`;
    text += `-----------------------------------\n`;
    text += `Terima kasih sudah berbelanja di Toko Gayeman.Qu! 🙏`;

    navigator.clipboard.writeText(text);
    alert('Rincian struk berhasil disalin! Silakan tempel (Paste / Ctrl+V) di chat WhatsApp pembeli.');
  };

  const handleSaveReceiptImage = async () => {
    if (cart.length === 0) {
      alert('Keranjang masih kosong!');
      return;
    }
    const element = receiptRef.current;
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const image = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = image;
    a.download = `Struk-GayemanQu-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      {/* HEADER */}
      <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">TOKO GAYEMAN.QU</h1>
          <p className="text-xs text-blue-100">Bukit Ayana Ciomas Blok B2/30</p>
        </div>
        <button
          onClick={() => setIsManageOpen(true)}
          className="bg-blue-700 hover:bg-blue-800 text-sm px-3 py-2 rounded-lg font-medium transition shadow cursor-pointer"
        >
          ⚙️ Pengaturan Menu
        </button>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 max-w-7xl mx-auto w-full">
        {/* KIRI: KATALOG PRODUK */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Cari menu Racikin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-2.5 border border-slate-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Kategori Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid Produk */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[60vh] p-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300 p-6">
                <p className="font-medium">Menu tidak ditemukan.</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const pPrice = Number(p.price) || 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between active:scale-95"
                  >
                    <div>
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">
                        {p.category}
                      </span>
                      <h3 className="font-semibold text-sm mt-1.5 line-clamp-2">{p.name}</h3>
                    </div>
                    <div className="mt-3 text-blue-600 font-bold text-sm">
                      Rp {pPrice.toLocaleString('id-ID')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* KANAN: KERANJANG & KASIR */}
        <div className="w-full md:w-96 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-base mb-3 border-b pb-2 text-slate-700">🛒 Keranjang Belanja</h2>
            
            <div className="mb-3">
              <label className="text-xs text-slate-500 font-medium block mb-1">Nama Pelanggan:</label>
              <input
                type="text"
                placeholder="Nama Pembeli (Opsional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* List Item Keranjang */}
            <div className="flex flex-col gap-2 max-h-[35vh] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-8">Keranjang masih kosong. Pilih menu di samping.</p>
              ) : (
                cart.map((item) => {
                  const itemPrice = Number(item.price) || 0;
                  const itemQty = Number(item.qty) || 0;
                  return (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 text-sm">
                      <div className="flex-1 pr-2">
                        <p className="font-medium text-xs line-clamp-1">{item.name}</p>
                        <p className="text-xs text-blue-600 font-semibold">Rp {(itemPrice * itemQty).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-1.5 py-0.5">
                        <button onClick={() => updateQty(item.id, -1)} className="text-slate-500 font-bold px-1 hover:text-red-600 cursor-pointer">-</button>
                        <span className="text-xs font-bold w-4 text-center">{itemQty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="text-slate-500 font-bold px-1 hover:text-blue-600 cursor-pointer">+</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* TOTAL & TOMBOL AKSI */}
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center mb-3 text-base font-bold">
              <span>Total:</span>
              <span className="text-blue-600">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleCopyWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm transition shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                📋 Salin Rincian ke WhatsApp
              </button>
              <button
                onClick={handleSaveReceiptImage}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                📥 Simpan Struk as Gambar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PENGATURAN MENU */}
      {isManageOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-slate-800">Pengaturan Menu</h3>
              <button
                onClick={() => {
                  setProducts(DEFAULT_PRODUCTS);
                  localStorage.removeItem('gayeman_products');
                  alert('Menu dikembalikan ke default Racikin!');
                }}
                className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold hover:bg-slate-200 transition cursor-pointer"
              >
                🔄 Reset Menu
              </button>
              <button
                onClick={() => setIsManageOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer ml-2"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-500">
                Menu lengkap Racikin sudah tertanam otomatis di dalam aplikasi dan siap digunakan di HP maupun komputer.
              </p>
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-xs text-blue-800">
                <span className="font-bold">Total menu aktif:</span> {products.length} item.
              </div>
            </div>

            <button
              onClick={() => setIsManageOpen(false)}
              className="w-full bg-slate-800 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-slate-900 transition mt-2 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* HIDDEN RECEIPT COMPONENT UNTUK DOWNLOAD GAMBAR */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div ref={receiptRef} style={{ width: '380px', padding: '24px', background: '#ffffff', fontFamily: 'monospace', color: '#000' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0' }}>TOKO GAYEMAN.QU</h2>
            <p style={{ fontSize: '11px', margin: '4px 0' }}>Bukit Ayana Ciomas Blok B2/30</p>
            <p style={{ fontSize: '10px', color: '#555', margin: '0' }}>----------------------------------------</p>
          </div>
          <div style={{ fontSize: '11px', marginBottom: '12px' }}>
            <p style={{ margin: '2px 0' }}>Tanggal: {new Date().toLocaleString('id-ID')}</p>
            <p style={{ margin: '2px 0' }}>Pelanggan: {customerName || 'Umum'}</p>
          </div>
          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '8px 0', marginBottom: '12px' }}>
            {cart.map((item, idx) => {
              const itemPrice = Number(item.price) || 0;
              const itemQty = Number(item.qty) || 0;
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                  <div>
                    <div>{item.name}</div>
                    <div style={{ color: '#444' }}>{itemQty} x @{itemPrice.toLocaleString('id-ID')}</div>
                  </div>
                  <div style={{ fontWeight: 'bold' }}>{(itemPrice * itemQty).toLocaleString('id-ID')}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>
            <span>TOTAL:</span>
            <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#555' }}>
            <p style={{ margin: '0' }}>Terima Kasih Atas Kunjungan Anda!</p>
            <p style={{ margin: '2px 0' }}>Barang yang sudah dibeli tidak dapat ditukar.</p>
          </div>
        </div>
      </div>
    </div>
  );
}