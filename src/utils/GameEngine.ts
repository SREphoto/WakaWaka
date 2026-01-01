export interface Point {
    x: number;
    y: number;
}

export interface GridCoord {
    q: number;
    r: number;
}

export const HEX_SIZE = 60; // Radius of hexagon
export const GRID_SIZE = 12;

// Hexagonal coordinate transformation
// Using "pointy-top" hex grid logic
export const hexToPixel = (q: number, r: number): Point => {
    const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
    const y = HEX_SIZE * (3 / 2) * r;
    return { x, y };
};

// Isometric Offset for the floor plane
export const getIsometricPos = (q: number, r: number) => {
    const { x, y } = hexToPixel(q, r);
    return {
        x: x,
        y: y
    };
};
