// backend/src/utils/alerts.ts

import logger from './logger';

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Alert categories
 */
export enum AlertCategory {
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  AVAILABILITY = 'availability',
  BILLING = 'billing',
  QUOTA = 'quota',
  SYSTEM = 'system'
}

/**
 * Alert interface
 */
export interface Alert {
  severity: AlertSeverity;
  category: AlertCategory;
  message: string;
  details?: any;
  timestamp: Date;
  resolved?: boolean;
}

/**
 * Alert manager for monitoring and notifications
 * In production, integrate with PagerDuty, Slack, email, etc.
 */
class AlertManager {
  private alerts: Alert[];
  private alertHandlers: Map<AlertCategory, Array<(alert: Alert) => void>>;

  constructor() {
    this.alerts = [];
    this.alertHandlers = new Map();
  }

  /**
   * Trigger an alert
   */
  trigger(
    severity: AlertSeverity,
    category: AlertCategory,
    message: string,
    details?: any
  ): void {
    const alert: Alert = {
      severity,
      category,
      message,
      details,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);

    // Log based on severity
    const logMessage = `[ALERT] [${severity.toUpperCase()}] [${category}] ${message}`;
    
    switch (severity) {
      case AlertSeverity.CRITICAL:
      case AlertSeverity.ERROR:
        logger.error(logMessage, details);
        break;
      case AlertSeverity.WARNING:
        logger.warn(logMessage, details);
        break;
      default:
        logger.info(logMessage, details);
    }

    // Call registered handlers
    const handlers = this.alertHandlers.get(category) || [];
    handlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        logger.error('Alert handler error:', error);
      }
    });

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
  }

  /**
   * Register an alert handler for a category
   */
  onAlert(category: AlertCategory, handler: (alert: Alert) => void): void {
    if (!this.alertHandlers.has(category)) {
      this.alertHandlers.set(category, []);
    }
    this.alertHandlers.get(category)!.push(handler);
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 100, category?: AlertCategory): Alert[] {
    let filtered = [...this.alerts];
    
    if (category) {
      filtered = filtered.filter(a => a.category === category);
    }

    return filtered.slice(-limit).reverse();
  }

  /**
   * Get unresolved alerts
   */
  getUnresolvedAlerts(category?: AlertCategory): Alert[] {
    let filtered = this.alerts.filter(a => !a.resolved);
    
    if (category) {
      filtered = filtered.filter(a => a.category === category);
    }

    return filtered;
  }

  /**
   * Mark alert as resolved (by index or filter)
   */
  resolveAlert(index: number): void {
    if (this.alerts[index]) {
      this.alerts[index].resolved = true;
    }
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  // ===== Predefined Alert Methods =====

  /**
   * Trigger rate limit alert
   */
  rateLimitExceeded(userId: string, limit: number): void {
    this.trigger(
      AlertSeverity.WARNING,
      AlertCategory.QUOTA,
      'Rate limit exceeded',
      { userId, limit }
    );
  }

  /**
   * Trigger quota exceeded alert
   */
  quotaExceeded(userId: string, used: number, limit: number): void {
    this.trigger(
      AlertSeverity.WARNING,
      AlertCategory.QUOTA,
      'Monthly quota exceeded',
      { userId, used, limit }
    );
  }

  /**
   * Trigger authentication failure alert
   */
  authFailure(type: string, attempts: number, ip: string): void {
    const severity = attempts > 10 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING;
    
    this.trigger(
      severity,
      AlertCategory.SECURITY,
      'Multiple authentication failures detected',
      { type, attempts, ip }
    );
  }

  /**
   * Trigger high error rate alert
   */
  highErrorRate(errorRate: number, threshold: number): void {
    this.trigger(
      AlertSeverity.ERROR,
      AlertCategory.PERFORMANCE,
      'High error rate detected',
      { errorRate, threshold }
    );
  }

  /**
   * Trigger slow response time alert
   */
  slowResponseTime(endpoint: string, responseTime: number, threshold: number): void {
    this.trigger(
      AlertSeverity.WARNING,
      AlertCategory.PERFORMANCE,
      'Slow response time detected',
      { endpoint, responseTime, threshold }
    );
  }

  /**
   * Trigger payment failure alert
   */
  paymentFailed(userId: string, amount: number, reason?: string): void {
    this.trigger(
      AlertSeverity.ERROR,
      AlertCategory.BILLING,
      'Payment processing failed',
      { userId, amount, reason }
    );
  }

  /**
   * Trigger database connection error
   */
  databaseError(error: string): void {
    this.trigger(
      AlertSeverity.CRITICAL,
      AlertCategory.AVAILABILITY,
      'Database connection error',
      { error }
    );
  }

  /**
   * Trigger high memory usage alert
   */
  highMemoryUsage(percentage: number, threshold: number): void {
    this.trigger(
      AlertSeverity.WARNING,
      AlertCategory.SYSTEM,
      'High memory usage detected',
      { percentage, threshold }
    );
  }
}

// Singleton instance
const alertManager = new AlertManager();

// Example: Set up alert handlers
alertManager.onAlert(AlertCategory.SECURITY, (alert) => {
  // In production: Send to PagerDuty, Slack, etc.
  if (alert.severity === AlertSeverity.CRITICAL) {
    logger.error('CRITICAL SECURITY ALERT:', alert);
    // sendToSlack(alert);
    // sendToPagersee(alert);
  }
});

alertManager.onAlert(AlertCategory.AVAILABILITY, (alert) => {
  // In production: Trigger incident response
  if (alert.severity === AlertSeverity.CRITICAL) {
    logger.error('CRITICAL AVAILABILITY ALERT:', alert);
    // triggerIncident(alert);
  }
});

export default alertManager;
