import api from "./api";

const notificationService = {
  async getNotifications() {
    const { data } = await api.get("/notifications");
    return data;
  },

  async markNotificationsRead(ids = null) {
    const { data } = await api.put("/notifications/mark-read", {
      ids,
    });

    return data;
  },
};

export default notificationService;
