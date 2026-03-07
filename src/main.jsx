import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "react-auth-kit";
import { Toaster } from "sonner";
import { ConfirmProvider } from "./components/Common/ConfirmDialog.jsx";

//test
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider authType={"localstorage"} authName={"_auth"}>
      <BrowserRouter>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </BrowserRouter>
    </AuthProvider>
    <Toaster
      position="top-right"
      richColors
      expand={false}
      closeButton
      duration={3000}
      toastOptions={{
        style: {
          borderRadius: "12px",
          fontSize: "13.5px",
          fontFamily: "inherit",
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / .08), 0 2px 4px -2px rgb(0 0 0 / .06)",
        },
        classNames: {
          toast: "items-start gap-3 px-4 py-3",
          title: "font-semibold",
          description: "text-xs opacity-80 leading-snug",
          actionButton:
            "!bg-foreground !text-background !text-xs !font-medium !rounded-lg !px-3 !h-7",
          cancelButton:
            "!bg-muted !text-muted-foreground !text-xs !font-medium !rounded-lg !px-3 !h-7",
          closeButton:
            "!border-border/50 !bg-background/80 hover:!bg-muted !transition-colors",
        },
      }}
    />
  </React.StrictMode>
);
