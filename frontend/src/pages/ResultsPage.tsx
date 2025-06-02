import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { Download, Copy, Search, CheckCircle, XCircle, ChevronLeft, ChevronRight, FileText, Info, X, User } from 'lucide-react'
import { api, PaginatedUrls, Import } from '../services/api'

interface DuplicateModalData {
  originalUrl: string
  createdAt: string
  importAlias: string
  importCreatedAt: string
}

export function ResultsPage() {
  const { profileName } = useParams<{ profileName: string }>()
  const [searchParams] = useSearchParams()
  const [paginatedData, setPaginatedData] = useState<PaginatedUrls | null>(null)
  const [allFilteredUrls, setAllFilteredUrls] = useState<any[]>([])
  const [imports, setImports] = useState<Import[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [domainFilter, setDomainFilter] = useState('')
  const [duplicateFilter, setDuplicateFilter] = useState<'all' | 'duplicates' | 'unique'>('all')
  const [importFilter, setImportFilter] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Modal for duplicate info
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateModalData, setDuplicateModalData] = useState<DuplicateModalData | null>(null)

  useEffect(() => {
    if (profileName) {
      fetchImports()
      // Check if we should filter by specific import from URL params
      const importIdFromUrl = searchParams.get('importId')
      if (importIdFromUrl) {
        setImportFilter(importIdFromUrl)
      }
    }
  }, [profileName, searchParams])

  useEffect(() => {
    if (profileName) {
      fetchUrls()
      fetchAllFilteredUrls()
    }
  }, [profileName, searchTerm, domainFilter, duplicateFilter, importFilter, currentPage, pageSize])

  const fetchImports = async () => {
    if (!profileName) return
    
    try {
      const importList = await api.getImportsByProfile(profileName)
      setImports(importList)
    } catch (err: any) {
      console.error('Failed to fetch imports:', err)
    }
  }

  const getFilters = () => {
    const filters: any = {}
    if (searchTerm) filters.search = searchTerm
    if (domainFilter) filters.domain = domainFilter
    if (duplicateFilter === 'duplicates') filters.isDuplicate = true
    else if (duplicateFilter === 'unique') filters.isDuplicate = false
    return filters
  }

  const fetchUrls = async () => {
    if (!profileName) return
    
    setLoading(true)
    try {
      const filters = getFilters()
      
      let data: PaginatedUrls
      if (importFilter) {
        // Fetch URLs for specific import
        data = await api.getUrlsByImport(importFilter, filters, {
          page: currentPage,
          pageSize
        })
      } else {
        // Fetch URLs for entire profile
        data = await api.getUrlsByProfile(profileName, filters, {
          page: currentPage,
          pageSize
        })
      }
      
      setPaginatedData(data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch URLs')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllFilteredUrls = async () => {
    if (!profileName) return
    
    try {
      const filters = getFilters()
      
      let allUrls: any[]
      if (importFilter) {
        allUrls = await api.getAllUrlsByImport(importFilter, filters)
      } else {
        allUrls = await api.getAllUrlsByProfile(profileName, filters)
      }
      
      setAllFilteredUrls(allUrls)
    } catch (err: any) {
      console.error('Failed to fetch all filtered URLs:', err)
    }
  }

  const handleExport = async (format: 'csv' | 'txt') => {
    if (!profileName) return
    
    try {
      const filters = getFilters()
      let blob: Blob
      
      if (importFilter) {
        blob = await api.exportUrlsByImport(importFilter, format, filters)
      } else {
        blob = await api.exportUrls(profileName, format, filters)
      }
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const extension = format === 'txt' ? 'txt' : 'csv'
      const filename = format === 'txt' ? 'cleaned-urls' : 'urls'
      a.download = `${profileName}-${filename}.${extension}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError('Failed to export URLs')
    }
  }

  const copyCleanedUrls = () => {
    const cleanedUrls = allFilteredUrls.map(url => url.cleanedUrl).join('\n')
    navigator.clipboard.writeText(cleanedUrls)
    
    // Show a brief success message
    const originalButtonText = 'Copy URLs'
    const button = document.querySelector('[data-copy-button]') as HTMLElement
    if (button) {
      const span = button.querySelector('span')
      if (span) {
        span.textContent = `Copied ${allFilteredUrls.length} URLs!`
        setTimeout(() => {
          span.textContent = originalButtonText
        }, 2000)
      }
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const resetFilters = () => {
    setSearchTerm('')
    setDomainFilter('')
    setDuplicateFilter('all')
    setImportFilter('')
    setCurrentPage(1)
  }

  const showDuplicateInfo = (url: any) => {
    console.log('Showing duplicate info for URL:', url) // Debug log
    if (url.isDuplicate) {
      if (url.duplicateOf) {
        setDuplicateModalData({
          originalUrl: url.duplicateOf.originalUrl,
          createdAt: url.duplicateOf.createdAt,
          importAlias: url.duplicateOf.import.alias,
          importCreatedAt: url.duplicateOf.import.createdAt
        })
      } else {
        // Fallback: if duplicateOf is not available, show basic info
        setDuplicateModalData({
          originalUrl: url.cleanedUrl,
          createdAt: url.createdAt,
          importAlias: 'Unknown',
          importCreatedAt: url.createdAt
        })
      }
      setShowDuplicateModal(true)
    }
  }

  if (loading && !paginatedData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && !paginatedData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
          <Link to="/" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const urls = paginatedData?.urls || []
  const uniqueDomains = [...new Set(allFilteredUrls.map(url => url.domain))].sort()
  const stats = {
    total: allFilteredUrls.length,
    duplicates: allFilteredUrls.filter(url => url.isDuplicate).length,
    unique: allFilteredUrls.filter(url => !url.isDuplicate).length,
    domains: uniqueDomains.length,
    currentPage: urls.length,
    totalInDatabase: paginatedData?.totalCount || 0
  }

  const selectedImport = imports.find(imp => imp.id === importFilter)

  const renderPagination = () => {
    if (!paginatedData || paginatedData.totalPages <= 1) return null

    const { page, totalPages } = paginatedData
    const pages = []
    
    // Always show first page
    if (page > 3) {
      pages.push(1)
      if (page > 4) pages.push('...')
    }
    
    // Show pages around current page
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
      pages.push(i)
    }
    
    // Always show last page
    if (page < totalPages - 2) {
      if (page < totalPages - 3) pages.push('...')
      pages.push(totalPages)
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * pageSize, paginatedData.totalCount)}</span> of{' '}
              <span className="font-medium">{paginatedData.totalCount}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {pages.map((pageNum, index) => (
                <button
                  key={index}
                  onClick={() => typeof pageNum === 'number' && handlePageChange(pageNum)}
                  disabled={pageNum === '...'}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    pageNum === page
                      ? 'z-10 bg-blue-600 text-white'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                  } ${pageNum === '...' ? 'cursor-default' : ''}`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedImport ? `Import: "${selectedImport.alias}"` : `Results for "${profileName}"`}
            </h1>
            <div className="flex space-x-4 mt-2 text-sm text-gray-600">
              <span>Filtered: {stats.total}</span>
              <span>Current Page: {stats.currentPage}</span>
              <span>Duplicates: {stats.duplicates}</span>
              <span>Unique: {stats.unique}</span>
              <span>Domains: {stats.domains}</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/profile/${encodeURIComponent(profileName!)}`}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <User className="h-4 w-4" />
              <span>Manage Profile</span>
            </Link>
            <Link
              to="/"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              ← New Search
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          {/* Import Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Import
            </label>
            <select
              value={importFilter}
              onChange={(e) => setImportFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All imports</option>
              {imports.map(imp => (
                <option key={imp.id} value={imp.id}>{imp.alias}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search URLs..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Domain Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domain
            </label>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All domains</option>
              {uniqueDomains.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>

          {/* Duplicate Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={duplicateFilter}
              onChange={(e) => setDuplicateFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All URLs</option>
              <option value="unique">Unique only</option>
              <option value="duplicates">Duplicates only</option>
            </select>
          </div>

          {/* Page Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Per Page
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 pt-4 border-t">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV ({stats.total})</span>
          </button>
          <button
            onClick={() => handleExport('txt')}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            <FileText className="h-4 w-4" />
            <span>Export TXT ({stats.total})</span>
          </button>
          <button
            onClick={copyCleanedUrls}
            data-copy-button
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Copy className="h-4 w-4" />
            <span>Copy URLs ({stats.total})</span>
          </button>
          <button
            onClick={resetFilters}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Import
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cleaned URL
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {urls.map((url) => (
                <tr 
                  key={url.id} 
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative">
                      {url.isDuplicate ? (
                        <div className="flex items-center text-red-600">
                          <XCircle className="h-4 w-4 mr-1" />
                          <span className="text-sm">Duplicate</span>
                          <button
                            onClick={() => showDuplicateInfo(url)}
                            className="ml-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <Info className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="text-sm">Unique</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link
                      to={`/import/${url.import.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {url.import.alias}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {url.domain}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <a
                      href={url.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 break-all"
                    >
                      {url.originalUrl}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <a
                      href={url.cleanedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 break-all"
                    >
                      {url.cleanedUrl}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {urls.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No URLs match your current filters.</p>
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Duplicate Info Modal */}
      {showDuplicateModal && duplicateModalData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Duplicate Information
              </h3>
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Original URL (first occurrence):
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md break-all">
                  {duplicateModalData.originalUrl}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Original Import:
                </label>
                <p className="text-sm text-gray-900">
                  {duplicateModalData.importAlias}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Import Created:
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(duplicateModalData.importCreatedAt).toLocaleDateString()} at{' '}
                  {new Date(duplicateModalData.importCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Original URL Added:
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(duplicateModalData.createdAt).toLocaleDateString()} at{' '}
                  {new Date(duplicateModalData.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 