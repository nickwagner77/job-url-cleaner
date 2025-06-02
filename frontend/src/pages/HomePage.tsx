import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Plus, ChevronDown } from 'lucide-react'
import { api } from '../services/api'

export function HomePage() {
  const [profileName, setProfileName] = useState('')
  const [alias, setAlias] = useState('')
  const [textInput, setTextInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const fetchProfileSuggestions = async (query: string) => {
    if (query.length < 1) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const profiles = await api.getProfiles()
      const filtered = profiles
        .map(p => p.name)
        .filter(name => name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10)
      
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } catch (err) {
      console.error('Failed to fetch profile suggestions:', err)
    }
  }

  const handleProfileNameChange = (value: string) => {
    setProfileName(value)
    fetchProfileSuggestions(value)
  }

  const selectSuggestion = (suggestion: string) => {
    setProfileName(suggestion)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.txt')) {
        setFile(selectedFile)
      } else {
        setError('Please select a valid text file (.txt)')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!profileName.trim()) {
      setError('Profile name is required')
      return
    }

    if (!alias.trim()) {
      setError('Import alias is required')
      return
    }

    if (!textInput.trim() && !file) {
      setError('Please provide URLs via text input or file upload')
      return
    }

    if (textInput.trim() && file) {
      setError('Please provide URLs via either text input or file upload, not both')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('profileName', profileName.trim())
      formData.append('alias', alias.trim())
      
      if (file) {
        formData.append('file', file)
      } else {
        formData.append('urls', textInput.trim())
      }

      const response = await api.processUrls(formData)
      
      // Emit custom event to refresh profiles in header
      window.dispatchEvent(new CustomEvent('profilesUpdated'))
      
      // Small delay to ensure backend has processed the new profile
      setTimeout(() => {
        // Navigate to results page with profile name and potentially import ID
        navigate(`/results/${encodeURIComponent(profileName.trim())}?importId=${response.importId}`)
      }, 100)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process URLs')
    } finally {
      setLoading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const generateAlias = () => {
    const now = new Date()
    const timestamp = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setAlias(`Import ${timestamp}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Job URL Cleaner & Deduplicator
          </h1>
          <p className="text-gray-600">
            Clean tracking parameters from URLs and detect duplicates within profiles
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Name with Autocomplete */}
          <div className="relative">
            <label htmlFor="profileName" className="block text-sm font-medium text-gray-700 mb-2">
              Profile Name *
            </label>
            <div className="relative">
              <input
                type="text"
                id="profileName"
                value={profileName}
                onChange={(e) => handleProfileNameChange(e.target.value)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => fetchProfileSuggestions(profileName)}
                placeholder="Enter a profile name to organize your URLs"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                required
              />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectSuggestion(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Import Alias */}
          <div>
            <label htmlFor="alias" className="block text-sm font-medium text-gray-700 mb-2">
              Import Alias *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="alias"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="e.g., June Applications, Tech Jobs, etc."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={generateAlias}
                className="flex items-center space-x-1 px-4 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Auto</span>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Give this import a memorable name to organize your URL collections
            </p>
          </div>

          {/* URL Input Methods */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Add URLs</h3>
            
            {/* Text Input */}
            <div>
              <label htmlFor="textInput" className="block text-sm font-medium text-gray-700 mb-2">
                Paste URLs (one per line)
              </label>
              <textarea
                id="textInput"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="https://example.com/job1&#10;https://example.com/job2&#10;..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!!file}
              />
            </div>

            {/* OR Divider */}
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500 bg-white">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Text File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                {file ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Selected: <strong>{file.name}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-800"
                        disabled={!!textInput.trim()}
                      >
                        Choose a file
                      </button>
                      <p className="text-sm text-gray-500">
                        Supports .txt files and OneTab exports
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={!!textInput.trim()}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing URLs...
              </span>
            ) : (
              'Process URLs'
            )}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-600 space-y-2">
          <p><strong>Supported formats:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Plain text files with one URL per line</li>
            <li>OneTab browser extension exports</li>
            <li>Direct paste from clipboard</li>
          </ul>
          <p className="mt-4">
            <strong>What this app does:</strong> Removes tracking parameters (utm_*, fbclid, etc.) 
            while preserving functional parameters, then detects and marks duplicate URLs within your profile.
          </p>
        </div>
      </div>
    </div>
  )
} 