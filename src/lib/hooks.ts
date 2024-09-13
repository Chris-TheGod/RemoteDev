import { useEffect, useState } from 'react';
import { JobItem, JobItemExpanded } from './types';
import { BASE_API_URL } from './constants';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Getting single job item ---------------------------------------------
type JobItemApiResponse = {
  public: boolean;
  jobItem: JobItemExpanded;
};

const fetchJobItem = async (id: number): Promise<JobItemApiResponse> => {
  const res = await fetch(`${BASE_API_URL}/${id}`);

  // 4xx or 5xx
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.description);
  }

  const data = await res.json();
  return data;
};

export function useJobItem(id: number | null) {
  const { data, isInitialLoading } = useQuery(
    ['job-item', id],
    () => (id ? fetchJobItem(id) : null),
    {
      staleTime: 1000 * 60 * 60,
      refetchOnWindowFocus: false,
      retry: false,
      enabled: Boolean(id),
      onError: (error) => {
        console.log(error);
      },
    }
  );

  return {
    jobItem: data?.jobItem,
    isLoading: isInitialLoading,
  } as const;
}

// Getting all job items ---------------------------------------------

type JobItemsApiResponse = {
  public: boolean;
  sorted: boolean;
  jobItems: JobItem[];
};

const fetchJobItems = async (
  searchText: string
): Promise<JobItemsApiResponse> => {
  const res = await fetch(`${BASE_API_URL}?search=${searchText}`);

  // 4xx or 5xx
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.description);
  }

  const data = await res.json();
  return data;
};

export function useJobItems(searchText: string) {
  const { data, isInitialLoading } = useQuery(
    ['job-items', searchText],
    () => fetchJobItems(searchText),
    {
      staleTime: 1000 * 60 * 60,
      refetchOnWindowFocus: false,
      retry: false,
      enabled: Boolean(searchText),
      onError: (error: unknown) => {
        let message;

        if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === 'string') {
          message = error;
        } else {
          message = 'An error occurred.';
        }

        toast.error(message);
      },
    }
  );

  return {
    jobItems: data?.jobItems,
    isLoading: isInitialLoading,
  } as const;
}

// ---------------------------------------------------------------------

export function useActiveId() {
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const id = +window.location.hash.slice(1);
      setActiveId(id);
    };
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return activeId;
}

export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedValue(value), delay);

    return () => clearTimeout(timerId);
  }, [value, delay]);

  return debouncedValue;
}
