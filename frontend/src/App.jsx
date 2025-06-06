import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";


function App() {
  const [activeMenu, setActiveMenu] = useState('Search Scores'); // Default active menu

  return (
    <div className="flex flex-col h-screen font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden"> {/* Prevents overall page scroll, allows internal scroll */}
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
        <MainContent /> {/* MainContent will have its own scroll if needed */}
      </div>
    </div>
  );
}

export default App;
