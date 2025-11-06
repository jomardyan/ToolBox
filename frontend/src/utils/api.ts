// frontend/src/utils/api.ts

import apiClient from './apiClient';

// Re-export apiClient as default for backward compatibility
export default apiClient;

// Conversion types
export type SupportedFormat = 'csv' | 'json' | 'xml' | 'yaml' | 'html' | 'tsv' | 'kml' | 'txt';

export interface ConversionPreset {
  id: string;
  name: string;
  sourceFormat: SupportedFormat;
  targetFormat: SupportedFormat;
  options?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BatchConversionRequest {
  items: Array<{
    data: string;
    sourceFormat: SupportedFormat;
    targetFormat: SupportedFormat;
    options?: Record<string, any>;
  }>;
}

export interface BatchConversionResponse {
  success: boolean;
  data?: {
    results: Array<{
      success: boolean;
      data?: string;
      error?: string;
    }>;
  };
  error?: string;
}

export interface ConversionResponse {
  success: boolean;
  data?: string;
  error?: string;
}

// Conversion service for handling data conversions
export const conversionService = {
  /**
   * Convert data from one format to another
   */
  convert: async (
    data: string,
    sourceFormat: SupportedFormat,
    targetFormat: SupportedFormat,
    options?: Record<string, any>
  ): Promise<ConversionResponse> => {
    try {
      const response = await apiClient.post('/convert', {
        data,
        sourceFormat,
        targetFormat,
        options,
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      const responseError = error.response?.data?.error || error.response?.data?.message;
      return {
        success: false,
        error: responseError || 'Conversion failed',
      };
    }
  },

  /**
   * Batch convert multiple items
   */
  batchConvert: async (request: BatchConversionRequest): Promise<BatchConversionResponse> => {
    try {
      const response = await apiClient.post('/convert/batch', request);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      const responseError = error.response?.data?.error || error.response?.data?.message;
      return {
        success: false,
        error: responseError || 'Batch conversion failed',
      };
    }
  },

  /**
   * Get available conversion presets
   */
  getPresets: async (): Promise<ConversionPreset[]> => {
    try {
      const response = await apiClient.get('/convert/presets');
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Create a new conversion preset
   */
  createPreset: async (
    name: string,
    sourceFormat: SupportedFormat,
    targetFormat: SupportedFormat,
    options?: Record<string, any>
  ): Promise<ConversionPreset | null> => {
    try {
      const response = await apiClient.post('/convert/presets', {
        name,
        sourceFormat,
        targetFormat,
        options,
      });
      return response.data.data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Delete a conversion preset
   */
  deletePreset: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/convert/presets/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get supported formats
   */
  getSupportedFormats: async (): Promise<SupportedFormat[]> => {
    try {
      const response = await apiClient.get('/convert/formats');
      return response.data.data || [];
    } catch (error) {
      return ['csv', 'json', 'xml', 'yaml', 'html', 'tsv', 'kml', 'txt'];
    }
  },
};

// Re-export the api object from apiClient
export { api } from './apiClient';
