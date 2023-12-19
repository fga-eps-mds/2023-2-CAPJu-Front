import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const isProduction = () => window.location.hostname !== "localhost"; // This should be replaced with a .env evalution

const app = isProduction() ? (
  <App />
) : (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
