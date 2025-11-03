import axios from 'axios';
import type { ConversionRequest, ConversionResult } from '../types';

// Determine API URL based on environment
let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// In GitHub Codespaces, use the port forwarding domain with correct port
if (typeof window !== 'undefined' && window.location.hostname.includes('github.dev')) {
  // Extract the codespace name and domain
  // Format: improved-robot-97ggq5g97792w5q-5173.app.github.dev
  // Need to change port to 3000: improved-robot-97ggq5g97792w5q-3000.app.github.dev
  const hostname = window.location.hostname;
  const isHttps = window.location.protocol === 'https:';
  
  // Replace the port number in the hostname
  const hostnameParts = hostname.split('-');
  if (hostnameParts.length >= 2) {
    // Remove the old port from hostname
    const baseHostname = hostnameParts.slice(0, -1).join('-');
    const newHostname = `${baseHostname}-3000.app.github.dev`;
    const protocol = isHttps ? 'https:' : 'http:';
    API_BASE_URL = `${protocol}//${newHostname}/api`;
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface BatchConversionRequest {
  items: ConversionRequest[];
}

export interface BatchConversionResult {
  success: boolean;
  data: {
    results: Array<{
      index: number;
      success: boolean;
      data?: string;
      error?: string;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  };
  statusCode: number;
  error?: string;
}

export interface ConversionPreset {
  id: string;
  name: string;
  sourceFormat: string;
  targetFormat: string;
  description: string;
  createdAt: Date;
}

export const conversionService = {
  convert: async (request: ConversionRequest): Promise<ConversionResult> => {
    try {
      const response = await apiClient.post('/convert', request);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        statusCode: error.response?.status || 500,
      };
    }
  },

  batchConvert: async (requests: BatchConversionRequest): Promise<BatchConversionResult> => {
    try {
      const response = await apiClient.post('/batch-convert', requests);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: {
          results: [],
          summary: {
            total: 0,
            successful: 0,
            failed: 0,
          },
        },
        error: error.response?.data?.error || error.message,
        statusCode: error.response?.status || 500,
      };
    }
  },

  extractColumns: async (
    csvData: string,
    columns: string[],
    filterOptions?: any
  ): Promise<ConversionResult> => {
    try {
      const response = await apiClient.post('/extract/csv-columns', {
        csvData,
        columns,
        filterOptions,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        statusCode: error.response?.status || 500,
      };
    }
  },

  savePreset: async (
    name: string,
    sourceFormat: string,
    targetFormat: string,
    description?: string
  ): Promise<any> => {
    try {
      const response = await apiClient.post('/presets', {
        name,
        sourceFormat,
        targetFormat,
        description,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        statusCode: error.response?.status || 500,
      };
    }
  },

  getPresets: async (): Promise<ConversionPreset[]> => {
    try {
      const response = await apiClient.get('/presets');
      return response.data.data || [];
    } catch {
      return [];
    }
  },

  health: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/health');
      return response.data.success;
    } catch {
      return false;
    }
  },
};

export default apiClient;
