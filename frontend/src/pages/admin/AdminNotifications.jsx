import {
  FiShoppingBag,
  FiRefreshCw,
  FiStar,
  FiPrinter,
  FiAlertCircle,
  FiUsers,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import notificationService from "@services/notificationService";
const getIcon = (type) => {
  switch (type) {
    case "order":
      return FiShoppingBag;

    case "return":
      return FiRefreshCw;

    case "review":
      return FiStar;

    case "print":
      return FiPrinter;

    case "customer":
      return FiUsers;

    default:
      return FiAlertCircle;
  }
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Notifications</h1>
        <p className="text-gray-500 mt-1">
          Stay updated with important store activity.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {notifications.map((item) => {
          const Icon = getIcon(item.type);

          return (
            <div
              key={item.id}
              className="flex items-start gap-4 p-5 border-b last:border-b-0 hover:bg-gray-50 transition"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                <Icon className="text-blue-600 text-xl" />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.message}</p>
              </div>

              <span className="text-xs text-gray-400 whitespace-nowrap">
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
