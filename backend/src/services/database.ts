import { PrismaClient } from '@prisma/client';
import { cleanUrl, extractDomain } from '../utils/urlCleaner';

const prisma = new PrismaClient();

export interface ProcessedUrl {
  originalUrl: string;
  cleanedUrl: string;
  domain: string;
  isDuplicate: boolean;
}

export interface UrlWithImport {
  id: string;
  originalUrl: string;
  cleanedUrl: string;
  domain: string;
  isDuplicate: boolean;
  createdAt: Date;
  duplicateOf?: {
    id: string;
    originalUrl: string;
    createdAt: Date;
    import: {
      alias: string;
      createdAt: Date;
    };
  };
  import: {
    id: string;
    alias: string;
    createdAt: Date;
    profile: {
      id: string;
      name: string;
    };
  };
}

export interface PaginatedUrls {
  urls: UrlWithImport[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ImportSummary {
  id: string;
  alias: string;
  createdAt: Date;
  urlCount: number;
  duplicateCount: number;
}

export class DatabaseService {
  // Profile operations
  async getAllProfiles() {
    return prisma.profile.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { 
            imports: true
          }
        },
        imports: {
          include: {
            _count: {
              select: { urls: true }
            }
          }
        }
      }
    });
  }

  async createProfile(name: string) {
    return prisma.profile.create({
      data: { name }
    });
  }

  async getProfileByName(name: string) {
    return prisma.profile.findUnique({
      where: { name }
    });
  }

  async findOrCreateProfile(name: string) {
    let profile = await this.getProfileByName(name);
    if (!profile) {
      profile = await this.createProfile(name);
    }
    return profile;
  }

  // Import operations
  async createImport(profileId: string, alias: string) {
    return prisma.import.create({
      data: {
        profileId,
        alias
      }
    });
  }

  async getImportsByProfile(profileName: string): Promise<ImportSummary[]> {
    const profile = await this.getProfileByName(profileName);
    if (!profile) return [];

    const imports = await prisma.import.findMany({
      where: { profileId: profile.id },
      include: {
        _count: {
          select: { urls: true }
        },
        urls: {
          select: { isDuplicate: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return imports.map(imp => ({
      id: imp.id,
      alias: imp.alias,
      createdAt: imp.createdAt,
      urlCount: imp._count.urls,
      duplicateCount: imp.urls.filter(url => url.isDuplicate).length
    }));
  }

  async deleteImport(importId: string) {
    return prisma.import.delete({
      where: { id: importId }
    });
  }

  // URL operations
  async processUrls(profileName: string, alias: string, urls: string[]): Promise<{ importId: string; processedUrls: ProcessedUrl[] }> {
    const profile = await this.findOrCreateProfile(profileName);
    
    // Create new import
    const newImport = await this.createImport(profile.id, alias);
    
    // Get existing URLs across all imports in this profile to check for duplicates
    const existingUrls = await prisma.url.findMany({
      where: { 
        import: { profileId: profile.id }
      },
      select: { cleanedUrl: true, id: true, createdAt: true, import: { select: { alias: true, createdAt: true } } }
    });
    
    const existingCleanedUrls = new Map(
      existingUrls.map(url => [url.cleanedUrl, { 
        id: url.id, 
        createdAt: url.createdAt,
        import: url.import
      }])
    );
    
    const processedUrls: ProcessedUrl[] = [];
    const newUrls: any[] = [];
    
    for (const originalUrl of urls) {
      const cleaned = cleanUrl(originalUrl);
      const domain = extractDomain(cleaned);
      const isDuplicate = existingCleanedUrls.has(cleaned);
      
      processedUrls.push({
        originalUrl,
        cleanedUrl: cleaned,
        domain,
        isDuplicate
      });
      
      // Prepare for batch insert
      newUrls.push({
        profileId: profile.id,
        importId: newImport.id,
        originalUrl,
        cleanedUrl: cleaned,
        domain,
        isDuplicate
      });
      
      // Add to existing set to detect duplicates within the same batch
      if (!isDuplicate) {
        existingCleanedUrls.set(cleaned, { 
          id: 'new', 
          createdAt: new Date(),
          import: { alias: alias, createdAt: new Date() }
        });
      }
    }
    
    // Batch insert new URLs
    if (newUrls.length > 0) {
      await prisma.url.createMany({
        data: newUrls
      });
    }
    
    return { importId: newImport.id, processedUrls };
  }

  async getUrlsByImport(
    importId: string,
    filters?: {
      domain?: string;
      isDuplicate?: boolean;
      search?: string;
    },
    pagination?: {
      page: number;
      pageSize: number;
    }
  ): Promise<PaginatedUrls> {
    const where: any = { importId };
    
    if (filters?.domain) {
      where.domain = { contains: filters.domain, mode: 'insensitive' };
    }
    
    if (filters?.isDuplicate !== undefined) {
      where.isDuplicate = filters.isDuplicate;
    }
    
    if (filters?.search) {
      where.OR = [
        { originalUrl: { contains: filters.search, mode: 'insensitive' } },
        { cleanedUrl: { contains: filters.search, mode: 'insensitive' } },
        { domain: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Get total count
    const totalCount = await prisma.url.count({ where });

    // Calculate pagination
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 50;
    const skip = (page - 1) * pageSize;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Get URLs with pagination
    const urls = await prisma.url.findMany({
      where,
      include: {
        import: {
          include: {
            profile: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    });

    // For duplicates, find the original URL they're duplicated with
    const urlsWithDuplicateInfo = await Promise.all(
      urls.map(async (url) => {
        let duplicateOf = undefined;
        
        if (url.isDuplicate && url.import) {
          // Find the first URL with the same cleaned URL in this profile
          const originalUrl = await prisma.url.findFirst({
            where: {
              import: { profileId: url.import.profile.id },
              cleanedUrl: url.cleanedUrl,
              createdAt: { lt: url.createdAt }
            },
            select: {
              id: true,
              originalUrl: true,
              createdAt: true,
              import: {
                select: {
                  alias: true,
                  createdAt: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          });
          
          // If we can't find the original with lt constraint, try without it
          if (!originalUrl) {
            const fallbackOriginal = await prisma.url.findFirst({
              where: {
                import: { profileId: url.import.profile.id },
                cleanedUrl: url.cleanedUrl,
                id: { not: url.id } // Exclude the current URL
              },
              select: {
                id: true,
                originalUrl: true,
                createdAt: true,
                import: {
                  select: {
                    alias: true,
                    createdAt: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            });
            
            if (fallbackOriginal) {
              duplicateOf = fallbackOriginal;
            }
          } else {
            duplicateOf = originalUrl;
          }
        }
        
        return {
          ...url,
          duplicateOf
        } as UrlWithImport;
      })
    );
    
    return {
      urls: urlsWithDuplicateInfo,
      totalCount,
      page,
      pageSize,
      totalPages
    };
  }

  async getUrlsByProfile(
    profileName: string, 
    filters?: {
      domain?: string;
      isDuplicate?: boolean;
      search?: string;
    },
    pagination?: {
      page: number;
      pageSize: number;
    }
  ): Promise<PaginatedUrls> {
    const profile = await this.getProfileByName(profileName);
    if (!profile) {
      return {
        urls: [],
        totalCount: 0,
        page: 1,
        pageSize: pagination?.pageSize || 50,
        totalPages: 0
      };
    }
    
    const where: any = { 
      import: { profileId: profile.id }
    };
    
    if (filters?.domain) {
      where.domain = { contains: filters.domain, mode: 'insensitive' };
    }
    
    if (filters?.isDuplicate !== undefined) {
      where.isDuplicate = filters.isDuplicate;
    }
    
    if (filters?.search) {
      where.OR = [
        { originalUrl: { contains: filters.search, mode: 'insensitive' } },
        { cleanedUrl: { contains: filters.search, mode: 'insensitive' } },
        { domain: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Get total count
    const totalCount = await prisma.url.count({ where });

    // Calculate pagination
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 50;
    const skip = (page - 1) * pageSize;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Get URLs with pagination
    const urls = await prisma.url.findMany({
      where,
      include: {
        import: {
          include: {
            profile: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    });

    // For duplicates, find the original URL they're duplicated with
    const urlsWithDuplicateInfo = await Promise.all(
      urls.map(async (url) => {
        let duplicateOf = undefined;
        
        if (url.isDuplicate && url.import) {
          // Find the first URL with the same cleaned URL in this profile
          const originalUrl = await prisma.url.findFirst({
            where: {
              import: { profileId: url.import.profile.id },
              cleanedUrl: url.cleanedUrl,
              createdAt: { lt: url.createdAt }
            },
            select: {
              id: true,
              originalUrl: true,
              createdAt: true,
              import: {
                select: {
                  alias: true,
                  createdAt: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          });
          
          // If we can't find the original with lt constraint, try without it
          if (!originalUrl) {
            const fallbackOriginal = await prisma.url.findFirst({
              where: {
                import: { profileId: url.import.profile.id },
                cleanedUrl: url.cleanedUrl,
                id: { not: url.id } // Exclude the current URL
              },
              select: {
                id: true,
                originalUrl: true,
                createdAt: true,
                import: {
                  select: {
                    alias: true,
                    createdAt: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            });
            
            if (fallbackOriginal) {
              duplicateOf = fallbackOriginal;
            }
          } else {
            duplicateOf = originalUrl;
          }
        }
        
        return {
          ...url,
          duplicateOf
        } as UrlWithImport;
      })
    );
    
    return {
      urls: urlsWithDuplicateInfo,
      totalCount,
      page,
      pageSize,
      totalPages
    };
  }

  async getStats(profileId: string) {
    const [totalUrls, duplicateUrls, uniqueDomains] = await Promise.all([
      prisma.url.count({ where: { import: { profileId } } }),
      prisma.url.count({ where: { import: { profileId }, isDuplicate: true } }),
      prisma.url.groupBy({
        by: ['domain'],
        where: { import: { profileId } },
        _count: { domain: true }
      })
    ]);
    
    return {
      totalUrls,
      duplicateUrls,
      uniqueUrls: totalUrls - duplicateUrls,
      uniqueDomains: uniqueDomains.length
    };
  }

  async disconnect() {
    await prisma.$disconnect();
  }

  // Methods for getting all URLs (used for export)
  async getAllUrlsByImport(
    importId: string,
    filters?: {
      domain?: string;
      isDuplicate?: boolean;
      search?: string;
    }
  ): Promise<UrlWithImport[]> {
    const result = await this.getUrlsByImport(importId, filters, { page: 1, pageSize: 10000 });
    return result.urls;
  }

  async getAllUrlsByProfile(
    profileName: string,
    filters?: {
      domain?: string;
      isDuplicate?: boolean;
      search?: string;
    }
  ): Promise<UrlWithImport[]> {
    const result = await this.getUrlsByProfile(profileName, filters, { page: 1, pageSize: 10000 });
    return result.urls;
  }
}

export const db = new DatabaseService(); 