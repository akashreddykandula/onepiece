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
  // Customer pages
  await queryClient.invalidateQueries({
    queryKey: ["products"],
  });
  await queryClient.refetchQueries({
    queryKey: ["products"],
    type: "active",
  });
  await queryClient.invalidateQueries({
    queryKey: ["product"],
  });
  await queryClient.refetchQueries({
    queryKey: ["product"],
    type: "active",
  });
  //categories
  await queryClient.invalidateQueries({
    queryKey: ["categories"],
  });
  await queryClient.refetchQueries({
    queryKey: ["categories"],
    type: "active",
  });
  // Admin inventory
  await queryClient.invalidateQueries({
    queryKey: ["admin-inventory"],
  });
  await queryClient.refetchQueries({
    queryKey: ["admin-inventory"],
    type: "active",
  });
  // Orders
  await queryClient.invalidateQueries({
    queryKey: ["admin-orders"],
  });
  await queryClient.refetchQueries({
    queryKey: ["admin-orders"],
    exact: false,
    type: "all",
  });
  await queryClient.invalidateQueries({
    queryKey: ["admin-dashboard"],
  });

  await queryClient.refetchQueries({
    queryKey: ["admin-dashboard"],
    type: "active",
  });
  //order updates
  await queryClient.invalidateQueries({
    queryKey: ["order"],
    exact: false,
  });

  await queryClient.refetchQueries({
    queryKey: ["order"],
    exact: false,
    type: "active",
  });
};

// Returns
await queryClient.invalidateQueries({
  queryKey: ["admin-returns"],
  exact: false,
});

await queryClient.refetchQueries({
  queryKey: ["admin-returns"],
  exact: false,
  type: "active",
});
socket.on("onlineUsersUpdated", async () => {
  await queryClient.invalidateQueries({
    queryKey: ["admin-dashboard"],
  });

  await queryClient.refetchQueries({
    queryKey: ["admin-dashboard"],
    type: "active",
  });
});

socket.on("productUpdated", refreshProducts);
socket.on("productCreated", refreshProducts);
socket.on("productDeleted", refreshProducts);
socket.on("productStockUpdated", refreshProducts);
socket.on("categoryCreated", refreshProducts);
socket.on("categoryUpdated", refreshProducts);
socket.on("categoryDeleted", refreshProducts);
socket.on("orderUpdated", refreshProducts);
socket.on("orderStatusUpdated", refreshProducts);
socket.on("returnRequestCreated", refreshProducts);
socket.on("returnStatusUpdated", refreshProducts);

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
