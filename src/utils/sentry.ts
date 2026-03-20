/**
 * Sentry helpers — logs, metrics, and performance spans.
 *
 * Usage examples:
 *
 *   import { log, metrics, measure } from '@/utils/sentry'
 *
 *   // Structured logs (visible in Sentry Logs explorer)
 *   log.info('reservation.created', { reservationId: 42, partySize: 4 })
 *   log.warn('menu.item_unavailable', { itemId: 7 })
 *   log.error('payment.failed', { reason: 'timeout' })
 *
 *   // Metrics (visible in Sentry Metrics explorer)
 *   metrics.count('reservation.created')
 *   metrics.count('reservation.cancelled', 1, { reason: 'user' })
 *   metrics.gauge('menu.item_count', 42)
 *   metrics.distribution('reservation.party_size', partySize)
 *
 *   // Custom performance span
 *   const result = await measure('menu.fetch', () => fetchMenu())
 */

import * as Sentry from '@sentry/nextjs'

// ---------------------------------------------------------------------------
// Structured logs
// ---------------------------------------------------------------------------

type LogContext = Record<string, string | number | boolean | null | undefined>

export const log = {
  debug: (message: string, context?: LogContext) =>
    Sentry.logger.debug(message, context),

  info: (message: string, context?: LogContext) =>
    Sentry.logger.info(message, context),

  warn: (message: string, context?: LogContext) =>
    Sentry.logger.warn(message, context),

  error: (message: string, context?: LogContext) =>
    Sentry.logger.error(message, context),

  fatal: (message: string, context?: LogContext) =>
    Sentry.logger.fatal(message, context),
}

// ---------------------------------------------------------------------------
// Metrics  (Sentry v10: count, gauge, distribution)
// ---------------------------------------------------------------------------

type MetricAttributes = Record<string, string | number | boolean>

export const metrics = {
  /**
   * Increment a counter (e.g. "reservation.created", "page.view")
   */
  count: (name: string, value = 1, attributes?: MetricAttributes) =>
    Sentry.metrics.count(name, value, { attributes }),

  /**
   * Record a current numeric value (e.g. active reservations count)
   */
  gauge: (name: string, value: number, attributes?: MetricAttributes) =>
    Sentry.metrics.gauge(name, value, { attributes }),

  /**
   * Track statistical distribution of a value (e.g. party size, latency ms)
   */
  distribution: (name: string, value: number, unit?: string, attributes?: MetricAttributes) =>
    Sentry.metrics.distribution(name, value, { unit, attributes }),
}

// ---------------------------------------------------------------------------
// Performance — custom spans
// ---------------------------------------------------------------------------

/**
 * Wraps an async function in a Sentry performance span.
 * The span is attached to the active transaction if one exists.
 *
 * @example
 *   const menu = await measure('menu.fetch_pages', () => fetchMenuPages())
 */
export async function measure<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  return Sentry.startSpan({ name, attributes }, fn)
}

