import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

export default function App() {
  const [products, setProducts] = useState(() => {
    const savedProducts = localStorage.getItem('toko_gayeman_products');
    return savedProducts ? JSON.parse(savedProducts) : [];
  });
  
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showManageMenu, setShowManageMenu] = useState(false);

  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Paket Ekonomis');

  useEffect(() => {
    localStorage.setItem('toko_gayeman_products', JSON.stringify(products));
  }, [products]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const importedProducts = [];

      rawData.forEach((row) => {
        const kategori = row[1];
        const nama = row[2];
        const harga = row[4];

        if (
          nama &&
          harga &&
          !isNaN(Number(harga)) &&
          nama !== 'Nama Produk'
        ) {
          importedProducts.push({
            id: Date.now() + Math.random(),
            name: String(nama).trim(),
            price: Number(harga),
            category: String(kategori).trim() || 'Lainnya',
          });
        }
      });

      if (importedProducts.length > 0) {
        setProducts(importedProducts);
        alert(`Berhasil mengimpor dan menyimpan ${importedProducts.length} produk ke sistem!`);
        setShowManageMenu(false);
      } else {
        alert('Gagal membaca produk. Pastikan format file Excel sesuai.');
      }
    };

    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice) return;

    const newProd = {
      id: Date.now(),
      name: newProductName,
      price: Number(newProductPrice),
      category: newProductCategory,
    };

    setProducts([...products, newProd]);
    setNewProductName('');
    setNewProductPrice('');
    setShowManageMenu(false);
  };

  const handleClearProducts = () => {
    if (window.confirm('Yakin ingin menghapus seluruh katalog produk yang tersimpan?')) {
      setProducts([]);
      localStorage.removeItem('toko_gayeman_products');
    }
  };

  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const increaseQty = (productId) => {
    setCart(
      cart.map((item) =>
        item.id === productId ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const decreaseQty = (productId) => {
    const existing = cart.find((item) => item.id === productId);
    if (existing.qty > 1) {
      setCart(
        cart.map((item) =>
          item.id === productId ? { ...item, qty: item.qty - 1 } : item
        )
      );
    } else {
      setCart(cart.filter((item) => item.id !== productId));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const categories = ['Semua', ...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Fungsi Utama: Download Struk Jadi Gambar & Buka WhatsApp Sekaligus
  const handleSendImageToWhatsApp = () => {
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong!');
      return;
    }

    const receiptElement = document.getElementById('printable-receipt');
    const noPrintElements = receiptElement.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.style.display = 'none');

    html2canvas(receiptElement, { scale: 2, backgroundColor: '#fffdf9' }).then((canvas) => {
      noPrintElements.forEach(el => el.style.display = '');

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      const namaFile = customerName ? `Struk_${customerName.replace(/\s+/g, '_')}.png` : 'Struk_Belanja.png';
      link.download = namaFile;
      link.click(); // Otomatis mendownload gambar struk ke perangkat

      // Format nomor HP pembeli jika diisi
      let formattedPhone = customerPhone.trim().replace(/[^0-9]/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.slice(1);
      }

      // Pesan pengantar untuk dikirim bersama gambar
      const pesan = `Halo ${customerName || 'Kak'}, berikut terlampir struk belanja Anda di Toko Gayeman.Qu. Terima kasih! 🙏`;
      const encodedMessage = encodeURIComponent(pesan);

      // Buka WhatsApp Web / Aplikasi WhatsApp
      const waUrl = formattedPhone 
        ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`
        : `https://api.whatsapp.com/send?text=${encodedMessage}`;

      window.open(waUrl, '_blank');
      
      alert('📥 Gambar struk berhasil disimpan ke folder Download!\n💬 WhatsApp akan dibuka. Silakan lampirkan gambar struk yang baru didownload ke chat pembeli.');
    });
  };

  const handleCheckout = () => {
    window.print();
    const metodeText = paymentMethod === 'transfer' ? 'Transfer Bank' : 'QRIS';
    const namaText = customerName ? ` atas nama ${customerName}` : '';
    alert(`Transaksi berhasil via ${metodeText}${namaText}! Total: Rp ${total.toLocaleString()}`);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', display: 'flex', gap: '20px', background: '#f4f6f9', minHeight: '100vh', color: '#333', alignItems: 'flex-start' }}>
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto !important;
            padding: 5px;
            background: white;
            box-shadow: none;
            border: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* BAGIAN KIRI: KELOLA & KATALOG */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }} className="no-print">
        
        <div style={{ background: 'white', padding: '15px 20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="👤 Nama Pembeli..."
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '10px 14px', 
              boxSizing: 'border-box', 
              borderRadius: '6px', 
              border: '1px solid #cbd5e1', 
              fontSize: '13px',
              outline: 'none',
              background: '#f8fafc'
            }}
          />
          <input
            type="text"
            placeholder="📱 No. WhatsApp (Opsional)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '10px 14px', 
              boxSizing: 'border-box', 
              borderRadius: '6px', 
              border: '1px solid #cbd5e1', 
              fontSize: '13px',
              outline: 'none',
              background: '#f8fafc'
            }}
          />
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#111', fontSize: '16px' }}>Kelola Katalog Produk</h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                {products.length > 0 ? `✅ ${products.length} produk tersimpan otomatis` : '⚠️ Belum ada produk tersimpan'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {products.length > 0 && (
                <button
                  onClick={handleClearProducts}
                  style={{
                    padding: '8px 12px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🗑️ Reset Data
                </button>
              )}
              <button
                onClick={() => setShowManageMenu(!showManageMenu)}
                style={{
                  padding: '8px 14px',
                  background: showManageMenu ? '#64748b' : '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {showManageMenu ? '✕ Tutup Menu' : '⚙️ Kelola Produk'}
              </button>
            </div>
          </div>

          {showManageMenu && (
            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#1e293b' }}>📊 Upload Ulang Pricelist (.xlsx)</h4>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0' }}>
                  Mengunggah file baru akan memperbarui data yang tersimpan.
                </p>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '5px', width: '100%', boxSizing: 'border-box', fontSize: '12px', background: 'white' }}
                />
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#1e293b' }}>➕ Tambah Produk Manual</h4>
                <form onSubmit={handleAddProduct} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Nama Produk"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    style={{ flex: 2, padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Harga (Rp)"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    required
                  />
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    style={{ padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="Paket Ekonomis">Paket Ekonomis</option>
                    <option value="Paket Premium">Paket Premium</option>
                    <option value="Paket Signature (RTC)">Paket Signature (RTC)</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  <button
                    type="submit"
                    style={{ width: '100%', padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Simpan Produk ke Katalog
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Katalog Produk */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ margin: 0, color: '#111', fontSize: '18px' }}>Katalog Produk ({filteredProducts.length})</h2>
            <input
              type="text"
              placeholder="🔍 Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #cbd5e1', width: '200px', fontSize: '13px' }}
            />
          </div>

          {products.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: 'none',
                    background: selectedCategory === cat ? '#2563eb' : '#f1f5f9',
                    color: selectedCategory === cat ? '#fff' : '#475569',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '30px', fontStyle: 'italic' }}>
              {products.length === 0 
                ? 'Belum ada produk tersimpan. Silakan klik "⚙️ Kelola Produk" untuk meng-upload file Excel pricelist Anda.'
                : 'Produk tidak ditemukan pada kategori atau pencarian tersebut.'}
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              {filteredProducts.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  style={{
                    padding: '20px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    background: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '11px', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                    {prod.category}
                  </span>
                  <h4 style={{ margin: '8px 0 10px 0', color: '#1e293b', fontSize: '16px' }}>{prod.name}</h4>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#2563eb', fontSize: '15px' }}>Rp {prod.price.toLocaleString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* BAGIAN KANAN: STRUK & TOMBOL AKSI */}
      <div 
        id="printable-receipt"
        style={{ 
          flex: 1, 
          background: '#fffdf9', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)', 
          display: 'flex', 
          flexDirection: 'column', 
          border: '1px solid #e2e8f0',
          fontFamily: 'Courier New, Courier, monospace',
          maxWidth: '380px'
        }}
      >
        <div>
          <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '1px dashed #94a3b8', paddingBottom: '8px' }}>
            <h2 style={{ margin: '0 0 2px 0', fontSize: '16px', letterSpacing: '1px', color: '#0f172a' }}>TOKO GAYEMAN.QU</h2>
            <p style={{ margin: '1px 0', fontSize: '10px', color: '#64748b' }}>Bukit Ayana Ciomas Blok B2/30</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#64748b' }}>{new Date().toLocaleString()}</p>
          </div>

          {customerName && (
            <div style={{ textAlign: 'center', margin: '8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {customerName}
              </span>
            </div>
          )}

          <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '3px' }}>
            Daftar Belanja:
          </div>
          
          {cart.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '11px', fontStyle: 'italic', textAlign: 'center', margin: '15px 0' }}>- Keranjang kosong -</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {cart.map((item) => (
                <li key={item.id} style={{ marginBottom: '8px', borderBottom: '1px dotted #e2e8f0', paddingBottom: '5px', fontSize: '11px' }}>
                  <div style={{ fontWeight: 'bold', color: '#1e293b', textAlign: 'left', marginBottom: '2px' }}>{item.name}</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="no-print">
                      <button
                        onClick={() => decreaseQty(item.id)}
                        style={{ background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '3px', width: '16px', height: '16px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 'bold', minWidth: '12px', textAlign: 'center', fontSize: '10px' }}>{item.qty}</span>
                      <button
                        onClick={() => increaseQty(item.id)}
                        style={{ background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '3px', width: '16px', height: '16px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        +
                      </button>
                      <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '2px' }}>x {item.price.toLocaleString()}</span>
                    </div>

                    <span style={{ fontWeight: 'bold', color: '#0f172a' }}>Rp {(item.price * item.qty).toLocaleString()}</span>
                    
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="no-print"
                      style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '3px', width: '16px', height: '16px', fontSize: '9px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Hapus"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginTop: '10px' }}>
          <div style={{ borderTop: '1px dashed #94a3b8', margin: '8px 0 6px 0', paddingTop: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
              <span>TOTAL:</span>
              <span style={{ color: '#16a34a' }}>Rp {total.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ marginBottom: '8px' }} className="no-print">
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', color: '#475569', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
              Metode Pembayaran:
            </label>
            <div style={{ display: 'flex', gap: '6px', fontFamily: 'Arial, sans-serif' }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                style={{
                  flex: 1,
                  padding: '5px',
                  borderRadius: '4px',
                  border: paymentMethod === 'transfer' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: paymentMethod === 'transfer' ? '#eff6ff' : '#fff',
                  color: paymentMethod === 'transfer' ? '#2563eb' : '#475569',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                🏦 Transfer
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                style={{
                  flex: 1,
                  padding: '5px',
                  borderRadius: '4px',
                  border: paymentMethod === 'qris' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: paymentMethod === 'qris' ? '#eff6ff' : '#fff',
                  color: paymentMethod === 'qris' ? '#2563eb' : '#475569',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                📱 QRIS
              </button>
            </div>
          </div>

          {paymentMethod === 'transfer' ? (
            <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '8px', fontSize: '10px' }}>
              <p style={{ margin: '0 0 3px 0', fontWeight: 'bold', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
                Transfer Rekening:
              </p>
              <p style={{ margin: '2px 0', color: '#334155' }}>BCA: <strong>1234-5678-90</strong></p>
              <p style={{ margin: '2px 0', color: '#334155' }}>Mandiri: <strong>0987-6543-21</strong></p>
            </div>
          ) : (
            <div className="no-print" style={{ textAlign: 'center', background: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '10px', color: '#475569', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>
                Scan QRIS:
              </p>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=TOKO_GAYEMAN_QU_TOTAL_${total}`}
                alt="QRIS"
                style={{ width: '90px', height: '90px', margin: '0 auto', display: 'block' }}
              />
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '9px', color: '#64748b', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
            <p style={{ margin: 0 }}>TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
          </div>

          {/* AREA TOMBOL AKSI (TERMASUK TOMBOL KIRIM GAMBAR KE WHATSAPP) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }} className="no-print">
            
            <button
              onClick={handleSendImageToWhatsApp}
              disabled={cart.length === 0}
              style={{
                width: '100%',
                padding: '9px',
                background: cart.length === 0 ? '#cbd5e1' : '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontWeight: 'bold',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'Arial, sans-serif',
                fontSize: '12px'
              }}
            >
              📤 Kirim Struk Gambar ke WhatsApp
            </button>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              style={{
                width: '100%',
                padding: '9px',
                background: cart.length === 0 ? '#cbd5e1' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontWeight: 'bold',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'Arial, sans-serif',
                fontSize: '12px'
              }}
            >
              🖨️ Cetak Struk Fisik
            </button>

          </div>
        </div>
      </div>

    </div>
  );
}