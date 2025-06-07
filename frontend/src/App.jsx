import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import SearchScore from "./components/pages/SearchScores";
import Dashboard from "./components/pages/Dashboard";
import Setting from "./components/pages/Setting";
import Report from "./components/pages/Report";

function App() {
  const [activeMenu, setActiveMenu] = useState("Search Scores"); // Default active menu

  return (
    <Router>
      <div className="flex flex-col h-screen font-sans">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          {" "}
          {/* Prevents overall page scroll, allows internal scroll */}
          <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
          <div className="flex-1 overflow-y-auto">
            {" "}
            {/* Main content area with scroll */}
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/search" element={<SearchScore />} />
              <Route path="/report" element={<Report />} />
              <Route path="/setting" element={<Setting />} />
              {/* Default to search page */}
              <Route path="*" element={<SearchScore />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
