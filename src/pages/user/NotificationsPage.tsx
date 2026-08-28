import React from "react";
import { Bell, CheckCircle2, Trash2 } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { notificationService } from "../../services/notificationService";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { formatDate } from "../../utils";

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Bildirishnomalar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Test natijalari, tangalar harakati va yangiliklar
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={markAllAsRead}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Barchasini o'qildi qilish
          </Button>
        )}
      </div>

      <Card className="divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500 space-y-2">
            <Bell className="w-10 h-10 text-slate-400 mx-auto" />
            <p>Bildirishnomalar mavjud emas</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.notificationId}
              onClick={() => markAsRead(n.notificationId)}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer transition-colors ${
                !n.isRead ? "bg-brand-500/5" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-500" />}
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {n.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {n.body}
                </p>
                <span className="text-[10px] text-slate-400 block pt-1">
                  {formatDate(n.createdAt)}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  notificationService.deleteNotification(n.notificationId);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};
