import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "react-auth-kit";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider authType={"localstorage"} authName={"_auth"}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
    <ToastContainer position="top-right" theme="dark" />
  </React.StrictMode>
);
