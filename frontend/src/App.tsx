import { Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { HomePage } from './pages/HomePage'
import { ResultsPage } from './pages/ResultsPage'
import { ProfilePage } from './pages/ProfilePage'
import { ImportResultsPage } from './pages/ImportResultsPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/results/:profileName" element={<ResultsPage />} />
          <Route path="/profile/:profileName" element={<ProfilePage />} />
          <Route path="/import/:importId" element={<ImportResultsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App 