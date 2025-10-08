import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./App.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <>
    <App />
    <Toaster />
  </>
  // </StrictMode>
);
