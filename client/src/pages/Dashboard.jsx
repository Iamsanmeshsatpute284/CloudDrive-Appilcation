import { useState, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import FileGrid from '../components/FileGrid'
import Navbar from '../components/Navbar'
import TrashView from '../components/TrashView'
import RecentView from '../components/RecentView'

function Dashboard() {
  const [currentFolder, setCurrentFolder] = useState(null)
  const [view, setView] = useState('myDrive')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleViewChange = useCallback((newView) => {
    setView(newView)
    // Force all views to remount with fresh data every time you switch
    setRefreshKey(prev => prev + 1)
    if (newView === 'myDrive') {
      setCurrentFolder(null)
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar view={view} setView={handleViewChange} />
        <main className="flex-1 overflow-auto p-6">

          {view === 'trash' && (
            <TrashView key={`trash-${refreshKey}`} />
          )}

          {view === 'recent' && (
            <RecentView key={`recent-${refreshKey}`} />
          )}

          {(view === 'myDrive' || view === 'starred') && (
            <FileGrid
              key={`${view}-${refreshKey}`}
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