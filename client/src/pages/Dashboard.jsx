import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import FileGrid from '../components/FileGrid'
import Navbar from '../components/Navbar'
import TrashView from '../components/TrashView'
import RecentView from '../components/RecentView'

function Dashboard() {
  const [currentFolder, setCurrentFolder] = useState(null)
  const [view, setView] = useState('myDrive')

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar view={view} setView={setView} />
        <main className="flex-1 overflow-auto p-6">
          {view === 'trash'  && <TrashView />}
          {view === 'recent' && <RecentView />}
          {(view === 'myDrive' || view === 'starred') && (
            <FileGrid
              currentFolder={currentFolder}
              setCurrentFolder={setCurrentFolder}
              view={view}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard