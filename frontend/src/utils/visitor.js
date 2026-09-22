import { visitorAPI } from "@services/api";

const VISITOR_ID_KEY = "onepiece_visitor_id";

const generateVisitorId = () => {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
};

export const registerVisitor = async () => {
  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);

    if (!visitorId) {
      visitorId = generateVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    const response = await visitorAPI.register(visitorId);

    return response.data;
  } catch (error) {
    console.error("Visitor registration failed:", error);
    return null;
  }
};
