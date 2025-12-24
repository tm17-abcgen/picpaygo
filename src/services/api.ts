// Mock API service for AI portrait generation
// These are placeholder functions that return mock data

export interface Generation {
  id: string;
  inputUrl: string;
  outputUrl: string;
  category: 'portraits' | 'editorial' | 'documentary';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface CreditsInfo {
  balance: number;
  isLoggedIn: boolean;
}

export interface CreditsPack {
  id: string;
  credits: number;
  price: number;
}

export const CREDIT_PACKS: CreditsPack[] = [
  { id: 'pack-5', credits: 5, price: 4.99 },
  { id: 'pack-10', credits: 10, price: 8.99 },
  { id: 'pack-20', credits: 20, price: 14.99 },
];

// Simulated delay for mock API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get visitor ID from localStorage or create one
const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
};

// Get credits from localStorage
const getStoredCredits = (): number => {
  const stored = localStorage.getItem('credits');
  if (stored === null) {
    // First visit: give 3 free credits
    localStorage.setItem('credits', '3');
    return 3;
  }
  return parseInt(stored, 10);
};

// Set credits in localStorage
const setStoredCredits = (credits: number): void => {
  localStorage.setItem('credits', credits.toString());
};

// Mock user state
const getMockUser = () => {
  const userData = localStorage.getItem('mock_user');
  return userData ? JSON.parse(userData) : null;
};

export const setMockUser = (user: { email: string } | null) => {
  if (user) {
    localStorage.setItem('mock_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('mock_user');
  }
};

// API Functions

export async function getCredits(): Promise<CreditsInfo> {
  await delay(300);
  const user = getMockUser();
  return {
    balance: getStoredCredits(),
    isLoggedIn: !!user,
  };
}

export async function generateImage(
  file: File,
  category: 'portraits' | 'editorial' | 'documentary'
): Promise<{ jobId: string }> {
  await delay(500);
  
  const credits = getStoredCredits();
  if (credits < 1) {
    throw new Error('Insufficient credits');
  }
  
  // Deduct credit
  setStoredCredits(credits - 1);
  
  // Create job
  const jobId = `job_${Date.now()}`;
  const inputUrl = URL.createObjectURL(file);
  
  // Store job in localStorage
  const jobs = JSON.parse(localStorage.getItem('generation_jobs') || '{}');
  jobs[jobId] = {
    id: jobId,
    inputUrl,
    outputUrl: '',
    category,
    status: 'queued',
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem('generation_jobs', JSON.stringify(jobs));
  
  // Simulate processing in background
  setTimeout(() => {
    const jobs = JSON.parse(localStorage.getItem('generation_jobs') || '{}');
    if (jobs[jobId]) {
      jobs[jobId].status = 'processing';
      localStorage.setItem('generation_jobs', JSON.stringify(jobs));
    }
  }, 1000);
  
  setTimeout(() => {
    const jobs = JSON.parse(localStorage.getItem('generation_jobs') || '{}');
    if (jobs[jobId]) {
      // Use a mock generated image (using the input as output for demo)
      jobs[jobId].status = 'completed';
      jobs[jobId].outputUrl = getMockOutputImage(category);
      localStorage.setItem('generation_jobs', JSON.stringify(jobs));
      
      // Add to generations history
      const generations = JSON.parse(localStorage.getItem('generations') || '[]');
      generations.unshift(jobs[jobId]);
      localStorage.setItem('generations', JSON.stringify(generations));
    }
  }, 4000);
  
  return { jobId };
}

function getMockOutputImage(category: string): string {
  // Return example images based on category
  const images: Record<string, string> = {
    portraits: 'https://images.pexels.com/photos/19456424/pexels-photo-19456424.jpeg?auto=compress&cs=tinysrgb&w=800',
    editorial: 'https://images.pexels.com/photos/2681751/pexels-photo-2681751.jpeg?auto=compress&cs=tinysrgb&w=800',
    documentary: 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=800',
  };
  return images[category] || images.portraits;
}

export async function getGenerationStatus(jobId: string): Promise<Generation | null> {
  await delay(200);
  
  const jobs = JSON.parse(localStorage.getItem('generation_jobs') || '{}');
  return jobs[jobId] || null;
}

export async function getGenerations(): Promise<Generation[]> {
  await delay(300);
  
  const generations = JSON.parse(localStorage.getItem('generations') || '[]');
  return generations;
}

export async function createCheckout(packId: string): Promise<{ success: boolean }> {
  await delay(800);
  
  const pack = CREDIT_PACKS.find(p => p.id === packId);
  if (!pack) {
    throw new Error('Invalid pack');
  }
  
  // Add credits
  const currentCredits = getStoredCredits();
  setStoredCredits(currentCredits + pack.credits);
  
  return { success: true };
}

// Auth mock functions
export async function login(email: string, password: string): Promise<{ success: boolean }> {
  await delay(500);
  
  if (!email || !password) {
    throw new Error('Email and password required');
  }
  
  setMockUser({ email });
  return { success: true };
}

export async function logout(): Promise<void> {
  await delay(200);
  setMockUser(null);
}

export async function getUser(): Promise<{ email: string } | null> {
  await delay(100);
  return getMockUser();
}
