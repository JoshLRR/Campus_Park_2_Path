/**
 * Path domain model definitions.
 *
 * This file defines the canonical TypeScript representation of a
 * **path or connection** between navigable nodes in the campus graph.
 * A Path describes the structural relationship between locations,
 * independent of how routes are calculated or rendered.
 *
 * Path types may be consumed by:
 * - Graph construction and traversal
 * - Routing and pathfinding algorithms
 * - Accessibility-aware navigation logic
 * - Map and directions visualization
 *
 * @remarks
 * This file should contain **types and interfaces only**.
 * No routing logic, weighting rules, or concrete data should be defined here.
 *
 * Paths are intended to act as graph edges, connecting rooms,
 * buildings, entrances, or intermediate waypoints while carrying
 * metadata such as distance, accessibility, or traversal constraints.
 *
 * @packageDocumentation
 */
