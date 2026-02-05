import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
const resizeObserverError = window.ResizeObserver;
window.ResizeObserver = class extends resizeObserverError {
  constructor(callback) {
    super((entries, observer) => {
      window.requestAnimationFrame(() => {
        callback(entries, observer);
      });
    });
  }
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
