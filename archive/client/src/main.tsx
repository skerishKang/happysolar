import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log('DEBUG: 1. main.tsx started.');

createRoot(document.getElementById("root")!).render(<App />);

console.log('DEBUG: 2. ReactDOM render called.');
