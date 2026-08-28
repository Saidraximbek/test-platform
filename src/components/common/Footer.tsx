import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100">TILLO Testing Platform</span>
            <span className="text-slate-400">|</span>
            <span className="text-xs text-slate-500">Bilimingizni sinang va Tillo tangalarini yuting</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/reviews" className="hover:text-brand-600 transition-colors">
              Fikr-mulohazalar
            </Link>
            <Link to="/questions/submit" className="hover:text-brand-600 transition-colors">
              Savol taklif qilish
            </Link>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Xavfsiz tizim
            </span>
          </div>

          <p className="text-xs text-slate-400 flex items-center gap-1">
            © {new Date().getFullYear()} Tillo. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </div>
    </footer>
  );
};
