import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';

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
  scale?: number;
}

const TileSystem: React.FC<TileSystemProps> = ({
  tileSize = 256,
  className = '',
  viewport,
  scale = 1,
}) => {
  // Automatically import all tile images using Vite's glob import
  const tiles = useMemo<TileData[]>(() => {
    // Use Vite's import.meta.glob to dynamically import all tile images
    const tileModules = import.meta.glob(
      '../../assets/tile_*.{png,jpg,jpeg,webp}',
      {
        eager: true,
        as: 'url',
      },
    );

    const tileList: TileData[] = [];

    for (const [path, url] of Object.entries(tileModules)) {
      // Extract filename from path
      const filename = path.split('/').pop() || '';

      // Parse tile coordinates from filename (e.g., "tile_r0_c1.png")
      const match = filename.match(/tile_r(\d+)_c(\d+)\./);

      if (match) {
        const row = parseInt(match[1], 10);
        const col = parseInt(match[2], 10);

        tileList.push({
          row,
          col,
          src: url as string,
        });
      } else {
        console.warn(
          `Tile filename doesn't match expected pattern: ${filename}`,
        );
      }
    }

    // Sort tiles for consistent ordering (optional, but helpful for debugging)
    tileList.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });

    console.log(`Loaded ${tileList.length} tiles:`, tileList);
    return tileList;
  }, []);

  const [loadedTiles, setLoadedTiles] = useState<Set<string>>(new Set());
  const loadingTiles = useRef<Set<string>>(new Set());

  const [tileNaturalSize, setTileNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const tileWidth = (tileNaturalSize?.width ?? tileSize) * scale;
  const tileHeight = (tileNaturalSize?.height ?? tileSize) * scale;

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
    if (!gridInfo) return tiles;
    if (!viewport) return tiles;

    const buffer = 1;

    const viewLeft = viewport.x;
    const viewRight = viewport.x + viewport.width / viewport.scale;
    const viewTop = viewport.y;
    const viewBottom = viewport.y + viewport.height / viewport.scale;

    const startCol = Math.max(
      gridInfo.minCol,
      Math.floor((viewLeft - buffer * tileWidth) / tileWidth) + gridInfo.minCol,
    );
    const endCol = Math.min(
      gridInfo.maxCol,
      Math.ceil((viewRight + buffer * tileWidth) / tileWidth) + gridInfo.minCol,
    );
    const startRow = Math.max(
      gridInfo.minRow,
      Math.floor((viewTop - buffer * tileHeight) / tileHeight) +
        gridInfo.minRow,
    );
    const endRow = Math.min(
      gridInfo.maxRow,
      Math.ceil((viewBottom + buffer * tileHeight) / tileHeight) +
        gridInfo.minRow,
    );

    const visible = tiles.filter(
      tile =>
        tile.col >= startCol &&
        tile.col <= endCol &&
        tile.row >= startRow &&
        tile.row <= endRow,
    );

    return visible;
  }, [tiles, gridInfo, viewport, tileWidth, tileHeight]);

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

    const sortedTiles = [...visibleTiles].sort((a, b) => {
      const aX = (a.col - (gridInfo?.minCol || 0)) * tileWidth + tileWidth / 2;
      const aY =
        (a.row - (gridInfo?.minRow || 0)) * tileHeight + tileHeight / 2;
      const bX = (b.col - (gridInfo?.minCol || 0)) * tileWidth + tileWidth / 2;
      const bY =
        (b.row - (gridInfo?.minRow || 0)) * tileHeight + tileHeight / 2;

      const aDist = Math.sqrt((aX - centerX) ** 2 + (aY - centerY) ** 2);
      const bDist = Math.sqrt((bX - centerX) ** 2 + (bY - centerY) ** 2);

      return aDist - bDist;
    });

    const maxConcurrentLoads = 6;
    let currentLoads = loadingTiles.current.size;

    sortedTiles.forEach(tile => {
      const tileKey = `tile_r${tile.row}_c${tile.col}`;

      if (
        !loadedTiles.has(tileKey) &&
        !loadingTiles.current.has(tileKey) &&
        currentLoads < maxConcurrentLoads
      ) {
        loadingTiles.current.add(tileKey);
        currentLoads++;

        const img = new Image();
        img.onload = () => {
          setTileNaturalSize(
            prev =>
              prev ?? {width: img.naturalWidth, height: img.naturalHeight},
          );
          handleTileLoad(tileKey);
        };
        img.onerror = () => handleTileError(tileKey);
        img.src = tile.src;
      }
    });
  }, [
    visibleTiles,
    loadedTiles,
    handleTileLoad,
    handleTileError,
    gridInfo,
    tileWidth,
    tileHeight,
    viewport,
  ]);

  if (!gridInfo || tiles.length === 0) {
    return (
      <div
        className="tile-system-empty"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '14px',
        }}
      >
        {tiles.length === 0
          ? 'No tiles found in assets folder'
          : 'Loading tiles...'}
      </div>
    );
  }

  return (
    <div
      className={`tile-system ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: gridInfo.gridWidth * tileWidth,
        height: gridInfo.gridHeight * tileHeight,
      }}
    >
      {visibleTiles.map(({row, col, src}) => {
        const tileKey = `tile_r${row}_c${col}`;
        const isLoaded = loadedTiles.has(tileKey);
        const isLoading = loadingTiles.current.has(tileKey);

        const x = (col - gridInfo.minCol) * tileWidth;
        const y = (row - gridInfo.minRow) * tileHeight;

        return (
          <div
            key={tileKey}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: tileWidth,
              height: tileHeight,
              backgroundColor: isLoaded ? 'transparent' : '#f0f0f0',
            }}
          >
            <img
              src={src}
              alt={`Tile ${row},${col}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'fill',
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
