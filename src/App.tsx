import { Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./hooks/useAuth";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import WatchDetail from "./pages/WatchDetail";
import BrandModels from "./pages/BrandModels";
import BrandList from "./pages/BrandList";
import Watchlist from "./pages/Watchlist";
import Config from "./pages/Config";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ExternalListingRedirect from "./pages/ExternalListingRedirect";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/watch/:ref" element={<WatchDetail />} />
          <Route path="/brands" element={<BrandList />} />
          <Route path="/brands/:slug" element={<BrandModels />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/config" element={<Config />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/external-listing" element={<ExternalListingRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}
