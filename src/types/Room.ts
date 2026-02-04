/**
 * Room domain model definitions.
 *
 * This file defines the canonical TypeScript type(s) representing a
 * **room or indoor destination** within the campus navigation system.
 * A Room describes *what a room is*, not how or where it is stored.
 *
 * Room types are shared across the application and may be consumed by:
 * - Search and destination discovery
 * - Map and indoor visualization
 * - Routing and directions logic
 * - Accessibility and utilities metadata
 *
 * @remarks
 * This file should contain **types and interfaces only**.
 * No concrete data, mock values, or environment-specific details
 * should be defined here.
 *
 * Separating Room types from Room data allows the application to:
 * - Enforce a single source of truth for room structure
 * - Swap data sources (static files, API, database) without changing consumers
 * - Maintain clear domain boundaries and data abstraction
 *
 * @packageDocumentation
 */
