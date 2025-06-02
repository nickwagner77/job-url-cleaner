import axios from 'axios'

const API_BASE_URL = '/api'

export interface Profile {
  id: string
  name: string
  createdAt: string
  _count: {
    urls: number
    imports: number
  }
  imports?: Import[]
}

export interface Import {
  id: string
  alias: string
  createdAt: string
  urlCount: number
  duplicateCount: number
}

export interface ProcessedUrl {
  originalUrl: string
  cleanedUrl: string
  domain: string
  isDuplicate: boolean
}

export interface UrlRecord {
  id: string
  originalUrl: string
  cleanedUrl: string
  domain: string
  isDuplicate: boolean
  createdAt: string
  duplicateOf?: {
    id: string
    originalUrl: string
    createdAt: string
    import: {
      alias: string
      createdAt: string
    }
  }
  import: {
    id: string
    alias: string
    createdAt: string
    profile: {
      id: string
      name: string
    }
  }
}

export interface PaginatedUrls {
  urls: UrlRecord[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ProcessUrlsResponse {
  profileName: string
  alias: string
  importId: string
  processed: number
  duplicates: number
  urls: ProcessedUrl[]
}

class ApiService {
  // Profile endpoints
  async getProfiles(): Promise<Profile[]> {
    const response = await axios.get(`${API_BASE_URL}/profiles`)
    return response.data
  }

  async createProfile(name: string): Promise<Profile> {
    const response = await axios.post(`${API_BASE_URL}/profiles`, { name })
    return response.data
  }

  // Import endpoints
  async getImportsByProfile(profileName: string): Promise<Import[]> {
    const response = await axios.get(`${API_BASE_URL}/urls/profile/${encodeURIComponent(profileName)}/imports`)
    return response.data
  }

  async deleteImport(importId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/urls/imports/${importId}`)
  }

  // URL endpoints
  async processUrls(formData: FormData): Promise<ProcessUrlsResponse> {
    const response = await axios.post(`${API_BASE_URL}/urls/process`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async getUrlsByImport(
    importId: string,
    filters?: {
      domain?: string
      isDuplicate?: boolean
      search?: string
    },
    pagination?: {
      page?: number
      pageSize?: number
    }
  ): Promise<PaginatedUrls> {
    const params = new URLSearchParams()
    
    if (filters?.domain) params.append('domain', filters.domain)
    if (filters?.isDuplicate !== undefined) params.append('isDuplicate', filters.isDuplicate.toString())
    if (filters?.search) params.append('search', filters.search)
    if (pagination?.page) params.append('page', pagination.page.toString())
    if (pagination?.pageSize) params.append('pageSize', pagination.pageSize.toString())

    const response = await axios.get(`${API_BASE_URL}/urls/import/${importId}?${params}`)
    return response.data
  }

  async getAllUrlsByImport(
    importId: string,
    filters?: {
      domain?: string
      isDuplicate?: boolean
      search?: string
    }
  ): Promise<UrlRecord[]> {
    const result = await this.getUrlsByImport(importId, filters, { page: 1, pageSize: 10000 })
    return result.urls
  }

  async getUrlsByProfile(
    profileName: string,
    filters?: {
      domain?: string
      isDuplicate?: boolean
      search?: string
    },
    pagination?: {
      page?: number
      pageSize?: number
    }
  ): Promise<PaginatedUrls> {
    const params = new URLSearchParams()
    
    if (filters?.domain) params.append('domain', filters.domain)
    if (filters?.isDuplicate !== undefined) params.append('isDuplicate', filters.isDuplicate.toString())
    if (filters?.search) params.append('search', filters.search)
    if (pagination?.page) params.append('page', pagination.page.toString())
    if (pagination?.pageSize) params.append('pageSize', pagination.pageSize.toString())

    const response = await axios.get(`${API_BASE_URL}/urls/${encodeURIComponent(profileName)}?${params}`)
    return response.data
  }

  async getAllUrlsByProfile(
    profileName: string,
    filters?: {
      domain?: string
      isDuplicate?: boolean
      search?: string
    }
  ): Promise<UrlRecord[]> {
    const result = await this.getUrlsByProfile(profileName, filters, { page: 1, pageSize: 10000 })
    return result.urls
  }

  async exportUrlsByImport(
    importId: string,
    format: 'csv' | 'txt' = 'csv',
    filters?: {
      domain?: string
      isDuplicate?: boolean
      search?: string
    }
  ): Promise<Blob> {
    const params = new URLSearchParams()
    
    params.append('format', format)
    if (filters?.domain) params.append('domain', filters.domain)
    if (filters?.isDuplicate !== undefined) params.append('isDuplicate', filters.isDuplicate.toString())
    if (filters?.search) params.append('search', filters.search)

    const response = await axios.get(`${API_BASE_URL}/urls/import/${importId}/export?${params}`, {
      responseType: 'blob',
    })
    return response.data
  }

  async exportUrls(
    profileName: string,
    format: 'csv' | 'txt' = 'csv',
    filters?: {
      domain?: string
      isDuplicate?: boolean
      search?: string
    }
  ): Promise<Blob> {
    const params = new URLSearchParams()
    
    params.append('format', format)
    if (filters?.domain) params.append('domain', filters.domain)
    if (filters?.isDuplicate !== undefined) params.append('isDuplicate', filters.isDuplicate.toString())
    if (filters?.search) params.append('search', filters.search)

    const response = await axios.get(`${API_BASE_URL}/urls/${encodeURIComponent(profileName)}/export?${params}`, {
      responseType: 'blob',
    })
    return response.data
  }

  async getStats(profileName: string) {
    const response = await axios.get(`${API_BASE_URL}/urls/${encodeURIComponent(profileName)}/stats`)
    return response.data
  }
}

export const api = new ApiService() 