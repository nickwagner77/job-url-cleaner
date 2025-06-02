import { Router } from 'express';
import { db } from '../services/database';

const router = Router();

// GET /api/profiles - Get all profiles
router.get('/', async (req, res) => {
  try {
    const profiles = await db.getAllProfiles();
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// POST /api/profiles - Create a new profile
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Profile name is required' });
    }
    
    const profile = await db.createProfile(name.trim());
    res.status(201).json(profile);
  } catch (error: any) {
    console.error('Error creating profile:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Profile name already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

export default router; 