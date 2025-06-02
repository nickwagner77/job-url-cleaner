const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateData() {
  console.log('Starting data migration...')
  
  try {
    // Get all profiles with their URLs
    const profiles = await prisma.profile.findMany({
      include: {
        urls: true
      }
    })
    
    console.log(`Found ${profiles.length} profiles to migrate`)
    
    for (const profile of profiles) {
      if (profile.urls.length === 0) {
        console.log(`Skipping profile "${profile.name}" - no URLs`)
        continue
      }
      
      console.log(`Migrating profile "${profile.name}" with ${profile.urls.length} URLs`)
      
      // Create a default import for existing URLs
      const defaultImport = await prisma.import.create({
        data: {
          profileId: profile.id,
          alias: 'Legacy Import',
          createdAt: profile.createdAt // Use profile creation date
        }
      })
      
      // Update all URLs to point to this import
      await prisma.url.updateMany({
        where: {
          profileId: profile.id,
          importId: null
        },
        data: {
          importId: defaultImport.id
        }
      })
      
      console.log(`✅ Migrated ${profile.urls.length} URLs for profile "${profile.name}"`)
    }
    
    console.log('✅ Data migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateData()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  }) 