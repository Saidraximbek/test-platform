import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star, MessageSquare, Plus, User } from "lucide-react";
import { reviewService } from "../../services/reviewService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { ReviewFormSchema } from "../../schemas";
import { Review } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { formatDate } from "../../utils";
import { z } from "zod";

type ReviewFormData = z.infer<typeof ReviewFormSchema>;

export const ReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(ReviewFormSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  const currentRating = watch("rating") || 5;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const list = await reviewService.getReviews("platform", "general", true);
        setReviews(list);
      } catch (err) {
        console.error("Error loading reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const onSubmit = async (data: ReviewFormData) => {
    if (!user) {
      toastError("Fikr bildirish uchun tizimga kiring");
      return;
    }
    setIsSubmitting(true);
    try {
      await reviewService.submitReview("platform", "general", data.rating, data.comment, user);
      success("Fikringiz uchun rahmat! Moderatorlar ko'rib chiqqach e'lon qilinadi.");
      setShowModal(false);
      reset();
    } catch (err: any) {
      toastError(err.message || "Fikr yuborishda xatolik");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Foydalanuvchilar Fikrlari
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Platformamiz haqida o'quvchilar va foydalanuvchilarning xolis mulohazalari
          </p>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          rightIcon={<Plus className="w-4 h-4" />}
        >
          Fikr qoldirish
        </Button>
      </div>

      {/* Reviews Grid */}
      {reviews.length === 0 ? (
        <Card className="p-16 text-center text-xs text-slate-500">
          Hozircha fikrlar mavjud emas. Birinchi bo'lib o'z fikringizni bildiring!
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((rev) => (
            <Card key={rev.reviewId} className="p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {rev.userPhotoURL ? (
                      <img
                        src={rev.userPhotoURL}
                        alt={rev.userDisplayName}
                        loading="lazy"
                        decoding="async"
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 flex items-center justify-center font-bold text-xs">
                        {rev.userDisplayName?.charAt(0) || "U"}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {rev.userDisplayName}
                      </h4>
                      <p className="text-[10px] text-slate-400">{formatDate(rev.createdAt)}</p>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => !isSubmitting && setShowModal(false)}
        title="Platforma haqida fikr bildirish"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Baho bering (1 dan 5 gacha)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setValue("rating", star)}
                  className="p-1 text-amber-400 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= currentRating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fikr va mulohazalaringiz
            </label>
            <textarea
              rows={4}
              placeholder="Platforma sizga qanday yordam berdi? Qanday takliflaringiz bor?"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs p-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500"
              {...register("comment")}
            />
            {errors.comment && (
              <p className="text-xs text-rose-500 mt-1">{errors.comment.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setShowModal(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Fikrni yuborish
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
