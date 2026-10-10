"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "components/AdminLayout";
import ImageUpload from "components/ImageUpload";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  is_active: boolean;
};

type FormState = { name: string; description: string; price: string; image_url: string; stock: string; is_active: boolean };
const emptyForm: FormState = { name: "", description: "", price: "", image_url: "", stock: "0", is_active: true };

export default function AdminEcommercePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadProducts = async () => {
    const response = await fetch("/api/admin/products");
    const data = await response.json();
    if (response.ok) setProducts(data.products ?? []);
    else setMessage(data.message || data.error || "Gagal memuat produk.");
  };

  useEffect(() => { loadProducts(); }, []);

  const updateField = (field: keyof FormState, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/products", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: editingId, price: Number(form.price), stock: Number(form.stock) }),
    });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Gagal menyimpan produk."); return; }
    setForm(emptyForm); setEditingId(null); setMessage("Produk berhasil disimpan."); loadProducts();
  };

  const edit = (product: Product) => {
    setEditingId(product.id);
    setForm({ name: product.name, description: product.description ?? "", price: String(product.price), image_url: product.image_url ?? "", stock: String(product.stock), is_active: product.is_active });
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus produk ini?")) return;
    await fetch("/api/admin/products", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    loadProducts();
  };

  return (
    <AdminLayout title="E-commerce" description="Kelola barang yang ditampilkan di katalog GKSBS.">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="border border-[#e5e5e5] bg-white p-6">
          <h2 className="text-h3 font-bold">Daftar Barang</h2>
          <div className="mt-6 space-y-3">
            {products.length === 0 ? <p className="text-on-surface-muted">Belum ada barang.</p> : products.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-4 border-b border-[#e5e5e5] py-4">
                <div><p className="font-semibold">{product.name}</p><p className="text-sm text-on-surface-muted">Rp {product.price.toLocaleString("id-ID")} · Stok {product.stock} · {product.is_active ? "Aktif" : "Nonaktif"}</p></div>
                <div className="flex gap-2"><button onClick={() => edit(product)} className="border border-[#e5e5e5] px-3 py-2 text-xs">Edit</button><button onClick={() => remove(product.id)} className="border border-red-200 px-3 py-2 text-xs text-red-600">Hapus</button></div>
              </div>
            ))}
          </div>
        </section>
        <form onSubmit={submit} className="h-fit space-y-4 border border-[#e5e5e5] bg-white p-6">
          <h2 className="text-h3 font-bold">{editingId ? "Edit Barang" : "Tambah Barang"}</h2>
          <input required placeholder="Nama barang" value={form.name} onChange={(e) => updateField("name", e.target.value)} className="input" />
          <textarea placeholder="Deskripsi" value={form.description} onChange={(e) => updateField("description", e.target.value)} className="input resize-none" rows={3} />
          <input required type="number" min="0" placeholder="Harga" value={form.price} onChange={(e) => updateField("price", e.target.value)} className="input" />
          <input required type="number" min="0" placeholder="Stok" value={form.stock} onChange={(e) => updateField("stock", e.target.value)} className="input" />
          <ImageUpload
            value={form.image_url}
            onChange={(url) => updateField("image_url", url)}
            label="Foto Produk"
            uploadEndpoint="/api/admin/upload-product"
          />
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => updateField("is_active", e.target.checked)} /> Tampilkan di katalog</label>
          <button type="submit" className="btn-primary w-full">{editingId ? "Perbarui Barang" : "Tambah Barang"}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="w-full border border-[#e5e5e5] py-3 text-sm">Batal</button>}
          {message && <p className="text-sm text-on-surface-muted">{message}</p>}
        </form>
      </div>
    </AdminLayout>
  );
}
