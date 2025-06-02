import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, FileText, Trash2, Plus, ExternalLink } from 'lucide-react'
import { api, Import } from '../services/api'

export function ProfilePage() {
  const { profileName } = useParams<{ profileName: string }>()
  const [imports, setImports] = useState<Import[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (profileName) {
      fetchImports()
    }
  }, [profileName])

  const fetchImports = async () => {
    if (!profileName) return
    
    setLoading(true)
    try {
      const importList = await api.getImportsByProfile(profileName)
      setImports(importList)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch imports')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteImport = async (importId: string) => {
    if (!confirm('Are you sure you want to delete this import? This will permanently remove all URLs in this import.')) {
      return
    }

    setDeletingId(importId)
    try {
      await api.deleteImport(importId)
      await fetchImports() // Refresh the list
      
      // Emit custom event to refresh profiles in header
      window.dispatchEvent(new CustomEvent('profilesUpdated'))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete import')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getTotalStats = () => {
    return {
      totalUrls: imports.reduce((sum, imp) => sum + imp.urlCount, 0),
      totalDuplicates: imports.reduce((sum, imp) => sum + imp.duplicateCount, 0),
      totalImports: imports.length
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
          <Link to="/" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const stats = getTotalStats()

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Profile: "{profileName}"
            </h1>
            <div className="flex space-x-6 mt-2 text-sm text-gray-600">
              <span>Total URLs: {stats.totalUrls}</span>
              <span>Duplicates: {stats.totalDuplicates}</span>
              <span>Unique: {stats.totalUrls - stats.totalDuplicates}</span>
              <span>Imports: {stats.totalImports}</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/results/${encodeURIComponent(profileName!)}`}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View All URLs</span>
            </Link>
            <Link
              to="/"
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Import</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Import History */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Import History</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your URL import sessions for this profile
          </p>
        </div>

        {imports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No imports yet</h3>
            <p className="text-gray-600 mb-4">
              Start by creating your first import for this profile
            </p>
            <Link
              to="/"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Import</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Import Alias
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URLs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duplicates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {imports.map((importItem) => (
                  <tr key={importItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {importItem.alias}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(importItem.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {importItem.urlCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        importItem.duplicateCount > 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {importItem.duplicateCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        to={`/import/${importItem.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View URLs
                      </Link>
                      <button
                        onClick={() => handleDeleteImport(importItem.id)}
                        disabled={deletingId === importItem.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deletingId === importItem.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/"
            className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-md hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <Plus className="h-6 w-6 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">Add New Import</div>
              <div className="text-sm text-gray-500">Import more URLs</div>
            </div>
          </Link>
          
          <Link
            to={`/results/${encodeURIComponent(profileName!)}`}
            className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-md hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <ExternalLink className="h-6 w-6 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">View All URLs</div>
              <div className="text-sm text-gray-500">See all {stats.totalUrls} URLs</div>
            </div>
          </Link>
          
          <Link
            to="/"
            className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-md hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">Back to Home</div>
              <div className="text-sm text-gray-500">Start over</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
} 