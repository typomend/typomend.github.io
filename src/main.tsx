import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "lenis/dist/lenis.css";
import "./styles/site.css";
import { App } from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// The page arrives already rendered, so React takes over the HTML that is
// there instead of drawing it again.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
