/**
 * Static room data source.
 *
 * This file provides concrete Room objects that conform to the
 * Room type definitions declared in {@link types/Room}.
 * It represents a **data layer concern**, not a domain definition.
 *
 * The data in this file may include:
 * - Initial or mock room listings
 * - Development-time fixtures
 * - Seed data for early routing and UI testing
 *
 * @remarks
 * This file intentionally contains **data only** and no business logic.
 * It may be replaced or supplemented in the future by:
 * - Backend API responses
 * - Database-driven room metadata
 * - Dynamically updated availability or status flags
 *
 * Keeping room data separate from room types ensures strong
 * data abstraction and allows routing, search, and map features
 * to evolve independently of where the data originates.
 */

export const rooms = [];
