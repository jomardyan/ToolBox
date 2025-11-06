// backend/src/utils/metricsCollector.ts

import logger from './logger';

/**
 * In-memory metrics collector for monitoring
 * In production, this should be replaced with proper metrics service (Prometheus, DataDog, etc.)
 */
class MetricsCollector {
  private metrics: Map<string, any>;
  private counters: Map<string, number>;
  private gauges: Map<string, number>;
  private histograms: Map<string, number[]>;

  constructor() {
    this.metrics = new Map();
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  /**
   * Set a gauge metric (current value)
   */
  setGauge(name: string, value: number, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);
  }

  /**
   * Record a histogram value (for response times, etc.)
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    
    // Keep only last 1000 values to prevent memory issues
    if (values.length > 1000) {
      values.shift();
    }
    
    this.histograms.set(key, values);
  }

  /**
   * Get counter value
   */
  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.buildKey(name, labels);
    return this.counters.get(key) || 0;
  }

  /**
   * Get gauge value
   */
  getGauge(name: string, labels?: Record<string, string>): number {
    const key = this.buildKey(name, labels);
    return this.gauges.get(key) || 0;
  }

  /**
   * Get histogram statistics
   */
  getHistogramStats(name: string, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    
    if (values.length === 0) {
      return { count: 0, min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99)
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const result: any = {
      counters: {},
      gauges: {},
      histograms: {}
    };

    this.counters.forEach((value, key) => {
      result.counters[key] = value;
    });

    this.gauges.forEach((value, key) => {
      result.gauges[key] = value;
    });

    this.histograms.forEach((values, key) => {
      result.histograms[key] = this.getHistogramStats(key);
    });

    return result;
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    logger.info('Metrics reset');
  }

  /**
   * Build metric key with labels
   */
  private buildKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    
    return `${name}{${labelStr}}`;
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    
    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Track API request
   */
  trackRequest(method: string, path: string, statusCode: number, responseTimeMs: number) {
    this.incrementCounter('api_requests_total', 1, { method, path, status: statusCode.toString() });
    this.recordHistogram('api_response_time_ms', responseTimeMs, { method, path });
    
    if (statusCode >= 500) {
      this.incrementCounter('api_errors_total', 1, { method, path, status: statusCode.toString() });
    }
  }

  /**
   * Track authentication event
   */
  trackAuth(type: 'jwt' | 'apikey' | 'oauth', success: boolean) {
    this.incrementCounter('auth_attempts_total', 1, { type, success: success.toString() });
  }

  /**
   * Track database query
   */
  trackDatabaseQuery(operation: string, durationMs: number) {
    this.recordHistogram('db_query_duration_ms', durationMs, { operation });
    this.incrementCounter('db_queries_total', 1, { operation });
  }
}

// Singleton instance
const metricsCollector = new MetricsCollector();

export default metricsCollector;
