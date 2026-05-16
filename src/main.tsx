import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./ui/App";
import "./ui/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  const baseUrl = import.meta.env.BASE_URL;
  const serviceWorkerUrl = `${baseUrl}sw.js`;

  void navigator.serviceWorker.register(serviceWorkerUrl).then((registration) => {
    void registration.update();
  });
}
