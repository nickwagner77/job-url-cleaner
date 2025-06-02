import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Database, ChevronDown, User } from 'lucide-react'
import { api, Profile } from '../services/api'

export function Header() {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const location = useLocation()

  useEffect(() => {
    fetchProfiles()
  }, [])

  // Refresh profiles when location changes (for navigation after profile creation)
  useEffect(() => {
    fetchProfiles()
  }, [location.pathname])

  // Listen for custom profilesUpdated event
  useEffect(() => {
    const handleProfilesUpdated = () => {
      fetchProfiles()
    }

    window.addEventListener('profilesUpdated', handleProfilesUpdated)
    
    return () => {
      window.removeEventListener('profilesUpdated', handleProfilesUpdated)
    }
  }, [])

  const fetchProfiles = async () => {
    try {
      const profileList = await api.getProfiles()
      setProfiles(profileList)
    } catch (err) {
      console.error('Failed to fetch profiles:', err)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Database className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">URL Cleaner</h1>
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Home
            </Link>
            
            {/* Profiles Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                onBlur={() => setTimeout(() => setShowProfileDropdown(false), 200)}
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Profiles</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
                      Recent Profiles
                    </div>
                    {profiles.length > 0 ? (
                      profiles.slice(0, 5).map((profile) => (
                        <Link
                          key={profile.id}
                          to={`/profile/${encodeURIComponent(profile.name)}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <div className="font-medium">{profile.name}</div>
                          <div className="text-xs text-gray-500">
                            {profile._count?.imports || 0} imports
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No profiles yet
                      </div>
                    )}
                    <div className="border-t border-gray-100 mt-1">
                      <Link
                        to="/"
                        className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        Create New Profile
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
} 