// API service for AI portrait generation (auth + credits via backend)

import type { GenerationCategory } from '@/types/generation';

export interface Generation {
  id: string;
  inputUrl?: string;
  outputUrl?: string;
  error?: string;
  category: GenerationCategory;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

// List item variant (returned by /api/generations)
export type GenerationListItem = Omit<Generation, 'inputUrl'>;

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
  { id: 'pack_2_5', credits: 5, price: 2.0 },
  { id: 'pack_3_10', credits: 10, price: 3.0 },
  { id: 'pack_5_20', credits: 20, price: 5.0 },
];

// Simulated delay for mock API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiFetch = async (path: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
      if (data?.detail) message = data.detail;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

// API Functions

export async function getCredits(): Promise<CreditsInfo> {
  await delay(200);
  const data = await apiFetch('/credits');
  return {
    balance: data.balance,
    isLoggedIn: data.isLoggedIn,
  };
}

export async function generateImage(
  file: File,
  category: GenerationCategory
): Promise<{ jobId: string }> {
  await delay(200);

  const formData = new FormData();
  formData.append('type', category);
  formData.append('image', file);

  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const data = await response.json();
      if (data?.detail) message = data.detail;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const data = await response.json();
  return { jobId: data.jobId };
}

export async function getGenerationStatus(jobId: string): Promise<Generation> {
  await delay(200);

  const data = await apiFetch(`/generate/${jobId}`);
  return {
    id: data.id,
    inputUrl: data.inputUrl || '',
    outputUrl: data.outputUrl || '',
    error: data.error || undefined,
    category: data.category,
    status: data.status,
    createdAt: data.createdAt,
    completedAt: data.completedAt || undefined,
  };
}

/**
 * List generations from the backend.
 * Scope can be 'auto' (user if logged in, else guest), 'user', or 'guest'.
 */
export async function getGenerations(
  scope: 'auto' | 'user' | 'guest' = 'auto',
  limit = 50,
  cursor?: string
): Promise<{ generations: Generation[]; cursor?: string }> {
  await delay(200);

  const params = new URLSearchParams({ scope: scope, limit: limit.toString() });
  if (cursor) {
    params.set('cursor', cursor);
  }

  const data = await apiFetch(`/generations?${params.toString()}`);

  type GenerationApiItem = {
    id: string;
    category: Generation['category'];
    status: Generation['status'];
    error?: string | null;
    createdAt: string;
    completedAt?: string | null;
    outputUrl?: string | null;
  };

  const generations = Array.isArray(data?.generations) ? (data.generations as GenerationApiItem[]) : [];

  return {
    generations: generations.map((g) => ({
      id: g.id,
      category: g.category,
      status: g.status,
      error: g.error || undefined,
      createdAt: g.createdAt,
      completedAt: g.completedAt || undefined,
      outputUrl: g.outputUrl || undefined,
    })),
    cursor: data.cursor || undefined,
  };
}

/**
 * Clear all generations for the current guest session.
 * Only works for guest users (not logged in).
 */
export async function clearGuestHistory(): Promise<void> {
  await apiFetch('/history/clear', { method: 'POST' });
}

export async function createCheckout(packId: string): Promise<{ url: string }> {
  await delay(800);

  const pack = CREDIT_PACKS.find(p => p.id === packId);
  if (!pack) {
    throw new Error('Invalid pack');
  }

  const data = await apiFetch('/credits/checkout', {
    method: 'POST',
    body: JSON.stringify({ packId: pack.id }),
  });

  return { url: data.url };
}

// Auth mock functions
export async function login(email: string, password: string): Promise<{ success: boolean }> {
  await delay(300);
  await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return { success: true };
}

export async function register(
  email: string,
  password: string
): Promise<{ verificationRequired: boolean }> {
  await delay(300);
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return { verificationRequired: !!data?.verificationRequired };
}

export async function logout(): Promise<void> {
  await delay(200);
  await apiFetch('/auth/logout', { method: 'POST' });
}

export async function getUser(): Promise<{ email: string; isVerified?: boolean } | null> {
  await delay(100);
  const data = await apiFetch('/auth/me');
  if (!data?.user) return null;
  return {
    email: data.user.email,
    isVerified: data.user.is_verified ?? data.user.isVerified,
  };
}

export async function verifyEmail(token: string): Promise<{ success: boolean }> {
  await delay(200);
  await apiFetch(`/auth/verify?token=${encodeURIComponent(token)}`);
  return { success: true };
}
