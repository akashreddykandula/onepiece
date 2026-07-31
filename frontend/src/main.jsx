import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import store from "@store/index";
import App from "./App";
import "@styles/globals.css";
import { socket } from "./services/socket";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    },
  },
});

const refreshProducts = async () => {
  // invalidating automatically refetches all active queries matching the key
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["products"] }),
    queryClient.invalidateQueries({ queryKey: ["product"] }),
    queryClient.invalidateQueries({ queryKey: ["categories"] }),
    queryClient.invalidateQueries({ queryKey: ["admin-inventory"] }),
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["order"] }),
    queryClient.invalidateQueries({ queryKey: ["admin-returns"] }),
  ]);
};

// Socket Listeners
socket.on("onlineUsersUpdated", () => {
  queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
});

const productEvents = [
  "productUpdated",
  "productCreated",
  "productDeleted",
  "productStockUpdated",
  "categoryCreated",
  "categoryUpdated",
  "categoryDeleted",
  "orderUpdated",
  "orderStatusUpdated",
  "returnRequestCreated",
  "returnStatusUpdated",
];

productEvents.forEach((event) => {
  socket.on(event, refreshProducts);
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);
