import express from 'express';
import multer from 'multer';
import { db } from '../services/database';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Process URLs (with alias for import)
router.post('/process', upload.single('file'), async (req, res) => {
  try {
    const { profileName, alias } = req.body;
    let { urls } = req.body;

    // Validation
    if (!profileName?.trim()) {
      return res.status(400).json({ error: 'Profile name is required' });
    }

    if (!alias?.trim()) {
      return res.status(400).json({ error: 'Import alias is required' });
    }

    // Handle file upload
    if (req.file) {
      const fs = require('fs');
      const fileContent = fs.readFileSync(req.file.path, 'utf-8');
      fs.unlinkSync(req.file.path); // Clean up uploaded file
      
      // Parse file content - handle different formats
      const lines = fileContent.split('\n').filter((line: string) => line.trim());
      
      // Check if it's OneTab format (URLs separated by | and descriptions)
      if (fileContent.includes(' | ')) {
        urls = lines
          .map((line: string) => line.split(' | ')[0])
          .filter((url: string) => url.trim() && url.startsWith('http'));
      } else {
        // Regular text file - one URL per line
        urls = lines.filter((line: string) => line.trim() && line.startsWith('http'));
      }
    } else if (typeof urls === 'string') {
      // Handle textarea input
      urls = urls.split('\n').filter((url: string) => url.trim() && url.startsWith('http'));
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'No valid URLs provided' });
    }

    // Process URLs
    const result = await db.processUrls(profileName.trim(), alias.trim(), urls);
    
    res.json({
      profileName: profileName.trim(),
      alias: alias.trim(),
      importId: result.importId,
      processed: result.processedUrls.length,
      duplicates: result.processedUrls.filter(url => url.isDuplicate).length,
      urls: result.processedUrls
    });
  } catch (error) {
    console.error('Error processing URLs:', error);
    res.status(500).json({ error: 'Failed to process URLs' });
  }
});

// Get imports for a profile
router.get('/profile/:profileName/imports', async (req, res) => {
  try {
    const { profileName } = req.params;
    const imports = await db.getImportsByProfile(profileName);
    res.json(imports);
  } catch (error) {
    console.error('Error fetching imports:', error);
    res.status(500).json({ error: 'Failed to fetch imports' });
  }
});

// Delete an import
router.delete('/imports/:importId', async (req, res) => {
  try {
    const { importId } = req.params;
    await db.deleteImport(importId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting import:', error);
    res.status(500).json({ error: 'Failed to delete import' });
  }
});

// Get URLs by import ID
router.get('/import/:importId', async (req, res) => {
  try {
    const { importId } = req.params;
    const { page = 1, pageSize = 50, domain, isDuplicate, search } = req.query;

    const filters: any = {};
    if (domain) filters.domain = domain as string;
    if (isDuplicate !== undefined) filters.isDuplicate = isDuplicate === 'true';
    if (search) filters.search = search as string;

    const pagination = {
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string)
    };

    const result = await db.getUrlsByImport(importId, filters, pagination);
    res.json(result);
  } catch (error) {
    console.error('Error fetching URLs by import:', error);
    res.status(500).json({ error: 'Failed to fetch URLs' });
  }
});

// Get URLs by profile (all imports)
router.get('/:profileName', async (req, res) => {
  try {
    const { profileName } = req.params;
    const { page = 1, pageSize = 50, domain, isDuplicate, search } = req.query;

    const filters: any = {};
    if (domain) filters.domain = domain as string;
    if (isDuplicate !== undefined) filters.isDuplicate = isDuplicate === 'true';
    if (search) filters.search = search as string;

    const pagination = {
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string)
    };

    const result = await db.getUrlsByProfile(profileName, filters, pagination);
    res.json(result);
  } catch (error) {
    console.error('Error fetching URLs:', error);
    res.status(500).json({ error: 'Failed to fetch URLs' });
  }
});

// Get all URLs by import (for export/copy functionality)
router.get('/import/:importId/all', async (req, res) => {
  try {
    const { importId } = req.params;
    const { domain, isDuplicate, search } = req.query;

    const filters: any = {};
    if (domain) filters.domain = domain as string;
    if (isDuplicate !== undefined) filters.isDuplicate = isDuplicate === 'true';
    if (search) filters.search = search as string;

    const urls = await db.getAllUrlsByImport(importId, filters);
    res.json(urls);
  } catch (error) {
    console.error('Error fetching all URLs by import:', error);
    res.status(500).json({ error: 'Failed to fetch URLs' });
  }
});

// Get all URLs by profile (for export/copy functionality)
router.get('/:profileName/all', async (req, res) => {
  try {
    const { profileName } = req.params;
    const { domain, isDuplicate, search } = req.query;

    const filters: any = {};
    if (domain) filters.domain = domain as string;
    if (isDuplicate !== undefined) filters.isDuplicate = isDuplicate === 'true';
    if (search) filters.search = search as string;

    const urls = await db.getAllUrlsByProfile(profileName, filters);
    res.json(urls);
  } catch (error) {
    console.error('Error fetching all URLs by profile:', error);
    res.status(500).json({ error: 'Failed to fetch URLs' });
  }
});

// Export URLs by import
router.get('/import/:importId/export', async (req, res) => {
  try {
    const { importId } = req.params;
    const { format = 'csv', domain, isDuplicate, search } = req.query;

    const filters: any = {};
    if (domain) filters.domain = domain as string;
    if (isDuplicate !== undefined) filters.isDuplicate = isDuplicate === 'true';
    if (search) filters.search = search as string;

    // Get all URLs (no pagination for export)
    const result = await db.getUrlsByImport(importId, filters, { page: 1, pageSize: 10000 });
    const urls = result.urls;

    if (format === 'txt') {
      const txtContent = urls.map(url => url.cleanedUrl).join('\n');
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="cleaned-urls.txt"');
      res.send(txtContent);
    } else {
      // CSV format
      const csvHeader = 'Original URL,Cleaned URL,Domain,Status,Import,Created At\n';
      const csvContent = urls.map(url => 
        `"${url.originalUrl}","${url.cleanedUrl}","${url.domain}","${url.isDuplicate ? 'Duplicate' : 'Unique'}","${url.import.alias}","${url.createdAt}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="urls.csv"');
      res.send(csvHeader + csvContent);
    }
  } catch (error) {
    console.error('Error exporting URLs:', error);
    res.status(500).json({ error: 'Failed to export URLs' });
  }
});

// Export URLs by profile (all imports)
router.get('/:profileName/export', async (req, res) => {
  try {
    const { profileName } = req.params;
    const { format = 'csv', domain, isDuplicate, search } = req.query;

    const filters: any = {};
    if (domain) filters.domain = domain as string;
    if (isDuplicate !== undefined) filters.isDuplicate = isDuplicate === 'true';
    if (search) filters.search = search as string;

    // Get all URLs (no pagination for export)
    const result = await db.getUrlsByProfile(profileName, filters, { page: 1, pageSize: 10000 });
    const urls = result.urls;

    if (format === 'txt') {
      const txtContent = urls.map(url => url.cleanedUrl).join('\n');
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="cleaned-urls.txt"');
      res.send(txtContent);
    } else {
      // CSV format
      const csvHeader = 'Original URL,Cleaned URL,Domain,Status,Import,Created At\n';
      const csvContent = urls.map(url => 
        `"${url.originalUrl}","${url.cleanedUrl}","${url.domain}","${url.isDuplicate ? 'Duplicate' : 'Unique'}","${url.import.alias}","${url.createdAt}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="urls.csv"');
      res.send(csvHeader + csvContent);
    }
  } catch (error) {
    console.error('Error exporting URLs:', error);
    res.status(500).json({ error: 'Failed to export URLs' });
  }
});

// Get stats by profile
router.get('/:profileName/stats', async (req, res) => {
  try {
    const { profileName } = req.params;
    const profile = await db.getProfileByName(profileName);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const stats = await db.getStats(profile.id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router; 