import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import DatabaseViewer from './pages/DatabaseViewer';
import QueryShell from './pages/QueryShell';
import APIGenerator from './pages/APIGenerator';
import Navbar from './components/Navbar';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={
              <>
                <Navbar />
                <Dashboard />
              </>
            }
          />
          <Route
            path="/database/:id"
            element={
              <>
                <Navbar />
                <DatabaseViewer />
              </>
            }
          />
          <Route
            path="/database/shell/:db_id"
            element={
              <>
                <Navbar />
                <QueryShell />
              </>
            }
          />
          <Route
            path="/database/api/:db_id"
            element={
              <>
                <Navbar />
                <APIGenerator />
              </>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;