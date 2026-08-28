import React, { useEffect, useState } from "react";
import { ShoppingBag, Plus, Edit2, Package, Tag } from "lucide-react";
import { shopService } from "../../services/shopService";
import { useToast } from "../../context/ToastContext";
import { Product, ProductCategory } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { Badge } from "../../components/common/Badge";
import { formatCoins } from "../../utils";

export const AdminProductsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [priceCoins, setPriceCoins] = useState<number>(100);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [category, setCategory] = useState<ProductCategory>("gift");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const list = await shopService.getProducts(undefined, false);
      setProducts(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setImageUrl("https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80");
    setPriceCoins(100);
    setDiscountPercent(0);
    setStock(10);
    setCategory("gift");
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setTitle(p.title);
    setSlug(p.slug);
    setDescription(p.description);
    setImageUrl(p.images?.[0] || "");
    setPriceCoins(p.priceCoins);
    setDiscountPercent(p.discountPercent || 0);
    setStock(p.stock);
    setCategory(p.category);
    setIsActive(p.isActive);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      toastError("Sarlavha va slug talab qilinadi");
      return;
    }

    setIsSaving(true);
    try {
      await shopService.saveProduct({
        productId: editingProduct?.productId,
        title,
        slug,
        description,
        images: [imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80"],
        priceCoins: Number(priceCoins),
        discountPercent: Number(discountPercent),
        stock: Number(stock),
        category,
        isActive,
      });

      success("Mahsulot muvaffaqiyatli saqlandi!");
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toastError(err.message || "Mahsulotni saqlashda xatolik");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Do'kon Mahsulotlari Boshqaruvi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sovg'alar, vaucherlar, kitoblar va zaxiralarni boshqarish
          </p>
        </div>

        <Button onClick={openCreateModal} rightIcon={<Plus className="w-4 h-4" />}>
          Yangi Mahsulot Qo'shish
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800 overflow-hidden divide-y divide-slate-800">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" className="text-brand-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Mahsulotlar mavjud emas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="p-4">Mahsulot</th>
                  <th className="p-4">Toifa</th>
                  <th className="p-4">Narxi</th>
                  <th className="p-4">Chegirma</th>
                  <th className="p-4">Zaxira</th>
                  <th className="p-4">Holat</th>
                  <th className="p-4 text-right">Tahrirlash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {products.map((p) => (
                  <tr key={p.productId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                            <Package className="w-5 h-5 text-slate-500" />
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-white block">{p.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{p.slug}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 capitalize text-slate-300">{p.category}</td>

                    <td className="p-4 font-bold text-amber-400">
                      {formatCoins(p.priceCoins)} Tillo
                    </td>

                    <td className="p-4">
                      {p.discountPercent > 0 ? (
                        <span className="font-bold text-rose-400">-{p.discountPercent}%</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    <td className="p-4 text-slate-300">{p.stock} dona</td>

                    <td className="p-4">
                      <Badge variant={p.isActive ? "success" : "neutral"}>
                        {p.isActive ? "Faol" : "Nofaol"}
                      </Badge>
                    </td>

                    <td className="p-4 text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEditModal(p)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? "Mahsulotni tahrirlash" : "Yangi mahsulot yaratish"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Mahsulot nomi"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!editingProduct) {
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, "")
                );
              }
            }}
          />

          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tavsif</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white"
            />
          </div>

          <Input
            label="Rasm URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Narx (Tillo tangada)"
              type="number"
              value={priceCoins}
              onChange={(e) => setPriceCoins(Number(e.target.value))}
            />

            <Input
              label="Chegirma foizi (0-100)"
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Zaxiradagi miqdor (Stock)"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Toifa</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-2.5 text-white"
              >
                <option value="gift">Sovg'a (Gift)</option>
                <option value="discount_voucher">Chegirma vaucheri</option>
                <option value="course_access">Kursga ruxsat</option>
                <option value="merch">Brend merch</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="productActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 border-slate-700 bg-slate-800"
            />
            <label htmlFor="productActive" className="text-xs text-slate-300 cursor-pointer">
              Sotuvda faol ko'rsatilsin
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
