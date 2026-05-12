import { Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import WatchDetail from "./pages/WatchDetail";
import BrandModels from "./pages/BrandModels";
import Watchlist from "./pages/Watchlist";
import Config from "./pages/Config";

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/watch/:ref" element={<WatchDetail />} />
        <Route path="/brands" element={<BrandModels />} />
        <Route path="/brands/:slug" element={<BrandModels />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/config" element={<Config />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
