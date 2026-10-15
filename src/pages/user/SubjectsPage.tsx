import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Layers, ArrowRight } from "lucide-react";
import { subjectService } from "../../services/subjectService";
import { Subject } from "../../types";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";

export const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const list = await subjectService.getSubjects(true);
        setSubjects(list);
      } catch (err) {
        console.error("Error loading subjects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <span>🧪 Fanlar va Onlayn Testlar</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Test ishlash uchun kerakli fanni tanlang va darajalar bo'yicha savollarni yechib, Tillo tangalar to'plang
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Hozircha faol fanlar mavjud emas
          </h3>
          <p className="text-xs text-slate-400 mt-1">Tez orada yangi fanlar qo'shiladi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Link key={subject.subjectId} to={`/levels/${subject.subjectId}`}>
              <Card hoverEffect className="p-6 h-full flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                      <Layers className="w-3 h-3" /> Darajali
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 transition-colors">
                    {subject.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">
                    {subject.description || "Ushbu fan bo'yicha turli qiyinlikdagi test savollari to'plami"}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-brand-600">
                  <span>Darajalarga o'tish</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
