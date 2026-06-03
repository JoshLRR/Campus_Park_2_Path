/**
 * mockCampusData.ts
 *
 * Stores placeholder campus building and room data used by the map UI.
 *
 * This data was extracted from App.tsx without changing behavior.
 */

import {Building, Room} from '../components/Map/MapView';

export const initialBuildings: (Building & {id: number})[] = [];

export const sampleRooms: (Room & {id: number})[] = [];
