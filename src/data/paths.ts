/**
 * Static path data source.
 *
 * This file provides concrete Path objects that define the
 * navigable connections between rooms, buildings, or waypoints
 * within the campus graph.
 *
 * The data in this file is used to:
 * - Construct the initial navigation graph
 * - Enable early routing and map visualization
 * - Support development and testing before backend integration
 *
 * @remarks
 * This file should contain **data only** and no routing logic.
 * All path interpretation, weighting, and filtering should be
 * handled by the pathing logic layer.
 *
 * In future iterations, this data source may be replaced by:
 * - Backend APIs
 * - Database-driven graph representations
 * - Dynamically updated campus infrastructure data
 *
 * Keeping path data separate from routing logic ensures strong
 * data abstraction and predictable algorithm behavior.
 */

export const paths = {};
