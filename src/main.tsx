import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ProvideWebCall } from "./hooks/use-webcall.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProvideWebCall>
      <App />
    </ProvideWebCall>
  </StrictMode>
);
