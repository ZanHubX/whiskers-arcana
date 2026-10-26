
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import RootRoutes from "./RootRoutes";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootRoutes />
  </StrictMode>
);
