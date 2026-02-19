import React from 'react';

type Props = {
  roomNumber: string;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
};

const Room: React.FC<Props> = ({
  roomNumber,
  isActive,
  onActivate,
  onDeactivate,
}) => {
  return (
    <div
      className={`rectangleBuilding ${isActive ? 'active' : ''}`}
      onPointerDown={onActivate}
      onPointerUp={onDeactivate}
      onPointerLeave={onDeactivate}
    >
      <div className="rectangleText">{roomNumber}</div>
    </div>
  );
};

export default Room;
