import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Import your tile images directly (Vite will handle the paths)
import tile_r0_c0 from '../../assets/tile_r0_c0.png';
import tile_r1_c0 from '../../assets/tile_r1_c0.png';

interface TileData {
  row: number;
  col: number;
  src: string;
}

interface ViewportInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

interface TileSystemProps {
  tileSize?: number;
  className?: string;
  viewport?: ViewportInfo;
}

const TileSystem: React.FC<TileSystemProps> = ({
                                                 tileSize = 256,
                                                 className = '',
                                                 viewport
                                               }) => {
  // Define your tiles with their imported sources
  const tiles = useMemo<TileData[]>(() => [
    { row: 0, col: 0, src: tile_r0_c0 },
    { row: 1, col: 0, src: tile_r1_c0 },
    // Add more tiles as you create them
  ], []);

  const [loadedTiles, setLoadedTiles] = useState<Set<string>>(new Set());
  const loadingTiles = useRef<Set<string>>(new Set());

  // Memoize grid calculations
  const gridInfo = useMemo(() => {
    if (tiles.length === 0) return null;

    const minRow = Math.min(...tiles.map(t => t.row));
    const maxRow = Math.max(...tiles.map(t => t.row));
    const minCol = Math.min(...tiles.map(t => t.col));
    const maxCol = Math.max(...tiles.map(t => t.col));

    return {
      minRow,
      maxRow,
      minCol,
      maxCol,
      gridWidth: maxCol - minCol + 1,
      gridHeight: maxRow - minRow + 1,
    };
  }, [tiles]);

  // Calculate visible tiles based on viewport (with viewport culling)
  const visibleTiles = useMemo(() => {
    if (!gridInfo) return tiles; // If no grid info, show all tiles
    if (!viewport) return tiles; // If no viewport info, show all tiles (fallback)

    const buffer = 1; // Buffer tiles around viewport (adjust as needed)

    // Calculate viewport bounds in world coordinates
    const viewLeft = viewport.x;
    const viewRight = viewport.x + viewport.width / viewport.scale;
    const viewTop = viewport.y;
    const viewBottom = viewport.y + viewport.height / viewport.scale;

    // Convert viewport bounds to tile coordinates
    const startCol = Math.max(
      gridInfo.minCol,
      Math.floor((viewLeft - buffer * tileSize) / tileSize) + gridInfo.minCol
    );
    const endCol = Math.min(
      gridInfo.maxCol,
      Math.ceil((viewRight + buffer * tileSize) / tileSize) + gridInfo.minCol
    );
    const startRow = Math.max(
      gridInfo.minRow,
      Math.floor((viewTop - buffer * tileSize) / tileSize) + gridInfo.minRow
    );
    const endRow = Math.min(
      gridInfo.maxRow,
      Math.ceil((viewBottom + buffer * tileSize) / tileSize) + gridInfo.minRow
    );

    // Filter tiles to only those that are potentially visible
    const visible = tiles.filter(tile =>
      tile.col >= startCol && tile.col <= endCol &&
      tile.row >= startRow && tile.row <= endRow
    );

    return visible;
  }, [tiles, gridInfo, viewport, tileSize]);

  const handleTileLoad = useCallback((tileKey: string) => {
    setLoadedTiles(prev => new Set([...prev, tileKey]));
    loadingTiles.current.delete(tileKey);
  }, []);

  const handleTileError = useCallback((tileKey: string) => {
    loadingTiles.current.delete(tileKey);
    console.warn(`Failed to load tile: ${tileKey}`);
  }, []);

  // Preload visible tiles with priority based on distance from viewport center
  useEffect(() => {
    if (!viewport) return;

    const centerX = viewport.x + viewport.width / (2 * viewport.scale);
    const centerY = viewport.y + viewport.height / (2 * viewport.scale);

    // Sort visible tiles by distance from viewport center
    const sortedTiles = [...visibleTiles].sort((a, b) => {
      const aX = (a.col - (gridInfo?.minCol || 0)) * tileSize + tileSize / 2;
      const aY = (a.row - (gridInfo?.minRow || 0)) * tileSize + tileSize / 2;
      const bX = (b.col - (gridInfo?.minCol || 0)) * tileSize + tileSize / 2;
      const bY = (b.row - (gridInfo?.minRow || 0)) * tileSize + tileSize / 2;

      const aDist = Math.sqrt((aX - centerX) ** 2 + (aY - centerY) ** 2);
      const bDist = Math.sqrt((bX - centerX) ** 2 + (bY - centerY) ** 2);

      return aDist - bDist;
    });

    // Limit concurrent loading to avoid overwhelming the browser
    const maxConcurrentLoads = 6;
    let currentLoads = loadingTiles.current.size;

    sortedTiles.forEach(tile => {
      const tileKey = `tile_r${tile.row}_c${tile.col}`;

      if (!loadedTiles.has(tileKey) &&
        !loadingTiles.current.has(tileKey) &&
        currentLoads < maxConcurrentLoads) {

        loadingTiles.current.add(tileKey);
        currentLoads++;

        const img = new Image();
        img.onload = () => handleTileLoad(tileKey);
        img.onerror = () => handleTileError(tileKey);
        img.src = tile.src;
      }
    });
  }, [visibleTiles, loadedTiles, handleTileLoad, handleTileError, gridInfo, tileSize, viewport]);

  if (!gridInfo || tiles.length === 0) return null;

  return (
    <div
      className={`tile-system ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: gridInfo.gridWidth * tileSize,
        height: gridInfo.gridHeight * tileSize,
      }}
    >
      {visibleTiles.map(({ row, col, src }) => {
        const tileKey = `tile_r${row}_c${col}`;
        const isLoaded = loadedTiles.has(tileKey);
        const isLoading = loadingTiles.current.has(tileKey);

        const x = (col - gridInfo.minCol) * tileSize;
        const y = (row - gridInfo.minRow) * tileSize;

        return (
          <div
            key={tileKey}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: tileSize,
              height: tileSize,
              backgroundColor: isLoaded ? 'transparent' : '#f0f0f0',
            }}
          >
            <img
              src={src}
              alt={`Tile ${row},${col}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
                display: 'block',
              }}
              onLoad={() => handleTileLoad(tileKey)}
              onError={() => handleTileError(tileKey)}
            />

            {!isLoaded && !isLoading && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '10px',
                  color: '#999',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              >
                {`${row},${col}`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(TileSystem);
