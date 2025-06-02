import { URL } from 'url';

// Tracking parameters to remove (these are purely for analytics/tracking)
const TRACKING_PARAMS = [
  // UTM parameters
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  // Facebook/Meta
  'fbclid', 'fb_source', 'fb_ref',
  // Google
  'gclid', 'gclsrc', 'dclid',
  // Other common tracking
  'ref', 'source', 'referrer', 'campaign', 'medium', 'origin',
  // Job sites specific tracking (but not functional IDs)
  'gh_src', 'trackingId', 'src', 'tk', 'from', 'sponsored',
  // LinkedIn tracking
  'refId', 'trk',
  // General analytics
  '_ga', '_gac', 'mc_cid', 'mc_eid'
];

// Functional parameters to keep (these are needed for the page to work correctly)
const FUNCTIONAL_PARAMS = [
  // Job identifiers
  'gh_jid', 'jid', 'job_id', 'jobId', 'id', 'posting_id',
  // Application tracking
  't', 'token', 'application_id',
  // Location/filtering
  'location', 'department', 'team', 'category',
  // Lever specific
  'lever-origin', 'lever-source' // Sometimes needed for application flow
];

export function cleanUrl(originalUrl: string): string {
  try {
    const url = new URL(originalUrl);
    
    // Remove tracking parameters while preserving functional ones
    const paramsToDelete: string[] = [];
    
    url.searchParams.forEach((value: string, key: string) => {
      const lowerKey = key.toLowerCase();
      
      // Check if it's a functional parameter we should keep
      const isFunctional = FUNCTIONAL_PARAMS.some(param => 
        lowerKey === param.toLowerCase() || 
        lowerKey.includes('jid') || // Keep any parameter with 'jid' (job ID)
        lowerKey.includes('job') && lowerKey.includes('id') // Keep job_id variants
      );
      
      // Check if it's a tracking parameter we should remove
      const isTracking = TRACKING_PARAMS.some(param => 
        lowerKey === param.toLowerCase() || 
        lowerKey.startsWith(param.toLowerCase() + '_')
      );
      
      // Remove if it's tracking and not functional
      if (isTracking && !isFunctional) {
        paramsToDelete.push(key);
      }
    });
    
    // Delete the tracking parameters
    paramsToDelete.forEach(param => url.searchParams.delete(param));
    
    // Normalize trailing slash (remove if present, except for root)
    if (url.pathname !== '/' && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }
    
    return url.toString();
  } catch (error) {
    console.error('Error cleaning URL:', error);
    return originalUrl; // Return original if cleaning fails
  }
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname || 'unknown';
  } catch (error) {
    console.error('Error extracting domain:', error);
    return 'unknown';
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

export function extractUrlsFromText(text: string): string[] {
  // Extract URLs from text using regex
  const urlRegex = /https?:\/\/[^\s<>"']+/gi;
  const matches = text.match(urlRegex) || [];
  
  // Filter valid URLs
  return matches.filter(url => isValidUrl(url));
} 