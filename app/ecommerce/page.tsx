"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
};

export default function EcommercePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/products", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Produk tidak dapat dimuat.");
        setProducts(data.products ?? []);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(error instanceof Error ? error.message : "Produk tidak dapat dimuat.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const checkout = async (productId: string) => {
    setCheckoutId(productId); setMessage("");
    try {
      const response = await fetch("/api/ecommerce/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error || "Checkout gagal."); return; }
      if (data.redirect_url) window.location.href = data.redirect_url;
    } catch { setMessage("Tidak dapat terhubung ke pembayaran."); }
    finally { setCheckoutId(null); }
  };

  return (
    <main className="bg-surface min-h-screen">
      <section className="border-b border-[#e5e5e5] bg-white">
        <div className="container py-16">
          <p className="label-caps mb-4">GKSBS Store</p>
          <h1 className="text-display font-black tracking-tighter leading-none">Pasaria</h1>
          <p className="mt-6 text-body-lg text-on-surface-muted max-w-xl">Produk dan perlengkapan pelayanan GKSBS.</p>
        </div>
      </section>
      <section className="container py-section">
        {loading ? <p className="text-on-surface-muted">Memuat produk...</p> : loadError ? (
          <div className="border border-red-200 bg-red-50 p-16 text-center text-red-800">
            <p className="font-semibold">Produk belum dapat dimuat.</p>
            <p className="mt-2 text-sm">{loadError}</p>
          </div>
        ) : products.length === 0 ? (
          <p className="border border-dashed border-[#e5e5e5] p-16 text-center text-on-surface-muted">Belum ada produk.</p>
        ) : (
          <div className="grid gap-px bg-[#e5e5e5] border border-[#e5e5e5] sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article key={product.id} className="bg-white p-6">
                {product.image_url && <img src={product.image_url} alt={product.name} className="mb-5 aspect-square w-full object-cover" />}
                <h2 className="text-h3 font-bold">{product.name}</h2>
                {product.description && <p className="mt-2 text-body-sm text-on-surface-muted">{product.description}</p>}
                <p className="mt-5 font-bold">Rp {Number(product.price).toLocaleString("id-ID")}</p>
                <p className="mt-1 text-caption text-on-surface-muted">Stok: {product.stock}</p>
                <button disabled={product.stock < 1 || checkoutId === product.id} onClick={() => checkout(product.id)} className="btn-primary mt-5 w-full disabled:opacity-40">
                  {checkoutId === product.id ? "Memproses..." : "Beli Sekarang"}
                </button>
              </article>
            ))}
          </div>
        )}
        {message && <p className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</p>}
      </section>
    </main>
  );
}
