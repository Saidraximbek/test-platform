import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Tag, Sparkles, Check, ArrowRight, Package } from "lucide-react";
import { shopService } from "../../services/shopService";
import { useAuth } from "../../context/AuthContext";
import { Product, ProductCategory } from "../../types";
import { Card } from "../../components/common/Card";
import { CoinBadge } from "../../components/common/CoinBadge";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { formatCoins } from "../../utils";

export const ShopPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const cat = selectedCategory !== "all" ? (selectedCategory as ProductCategory) : undefined;
        const list = await shopService.getProducts(cat, true);
        setProducts(list);
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory]);

  const categories = [
    { id: "all", name: "Barchasi" },
    { id: "gift", name: "Sovg'alar" },
    { id: "discount_voucher", name: "Chegirma Vaucherlari" },
    { id: "course_access", name: "Maxsus Kurslar" },
    { id: "merch", name: "Brend Merch" },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl p-8 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/10 text-xs font-black uppercase tracking-wider mb-2">
            <ShoppingBag className="w-3.5 h-3.5" /> Tillo Do'koni
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Tangalaringizni Haqiqiy Sovg'alarga Almashtiring!
          </h1>
          <p className="text-xs sm:text-sm font-medium opacity-90 mt-1 max-w-xl">
            Testlarda to'plagan Tillo tangalaringiz orqali kitoblar, vaucherlar, kurslar va sovg'alarga ega bo'ling.
          </p>
        </div>

        <div className="bg-slate-950 text-white p-4 rounded-2xl shrink-0 text-center">
          <span className="text-xs text-slate-400 block mb-1">Sizning balansingiz</span>
          <CoinBadge amount={user?.coinBalance || 0} size="lg" />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === cat.id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : products.length === 0 ? (
        <Card className="p-16 text-center text-xs text-slate-500">
          Ushbu toifada hozircha mahsulotlar mavjud emas
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const hasDiscount = product.discountPercent > 0;
            const discountedPrice = Math.round(
              product.priceCoins * (1 - (product.discountPercent || 0) / 100)
            );
            const isOutOfStock = product.stock <= 0;

            return (
              <Card
                key={product.productId}
                hoverEffect
                className="overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Package className="w-12 h-12" />
                      </div>
                    )}

                    {hasDiscount && (
                      <span className="absolute top-3 left-3 bg-rose-500 text-white text-[11px] font-black px-2 py-0.5 rounded-lg shadow">
                        -{product.discountPercent}%
                      </span>
                    )}

                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center text-white font-bold text-xs uppercase tracking-wider">
                        Tugagan
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {product.category}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-black text-amber-500">
                      {formatCoins(hasDiscount ? discountedPrice : product.priceCoins)} Tillo
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-slate-400 line-through">
                        {formatCoins(product.priceCoins)}
                      </span>
                    )}
                  </div>

                  <Link to={`/shop/${product.productId}`}>
                    <Button
                      variant={isOutOfStock ? "secondary" : "amber"}
                      size="sm"
                      disabled={isOutOfStock}
                      className="w-full"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {isOutOfStock ? "Mavjud emas" : "Xarid qilish"}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
