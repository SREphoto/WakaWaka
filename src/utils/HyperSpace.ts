export interface Point4D {
    x: number;
    y: number;
    z: number;
    w: number;
}

export interface Point3D {
    x: number;
    y: number;
    z: number;
}

export const rotate4D = (point: Point4D, angle: number, plane: 'XW' | 'YW' | 'ZW' | 'XY' | 'XZ' | 'YZ'): Point4D => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const p = { ...point };

    switch (plane) {
        case 'XW':
            p.x = point.x * cos - point.w * sin;
            p.w = point.x * sin + point.w * cos;
            break;
        case 'YW':
            p.y = point.y * cos - point.w * sin;
            p.w = point.y * sin + point.w * cos;
            break;
        case 'ZW':
            p.z = point.z * cos - point.w * sin;
            p.w = point.z * sin + point.w * cos;
            break;
        case 'XY':
            p.x = point.x * cos - point.y * sin;
            p.y = point.x * sin + point.y * cos;
            break;
    }
    return p;
};

export const project4DTo3D = (point: Point4D, distance: number = 2): Point3D => {
    const w = 1 / (distance - point.w);
    return {
        x: point.x * w,
        y: point.y * w,
        z: point.z * w
    };
};

export const TESSERACT_VERTICES: Point4D[] = [];
for (let i = 0; i < 16; i++) {
    TESSERACT_VERTICES.push({
        x: (i & 1) ? 1 : -1,
        y: (i & 2) ? 1 : -1,
        z: (i & 4) ? 1 : -1,
        w: (i & 8) ? 1 : -1
    });
}

// 24 Faces of a Tesseract (each face is a square defined by 4 vertex indices)
export const TESSERACT_FACES = [
    // Outer/Inner cubes
    [0, 1, 3, 2], [4, 5, 7, 6], [8, 9, 11, 10], [12, 13, 15, 14],
    [0, 1, 5, 4], [2, 3, 7, 6], [8, 9, 13, 12], [10, 11, 15, 14],
    [0, 2, 6, 4], [1, 3, 7, 5], [8, 10, 14, 12], [9, 11, 15, 13],
    // Connecting faces
    [0, 1, 9, 8], [2, 3, 11, 10], [4, 5, 13, 12], [6, 7, 15, 14],
    [0, 2, 10, 8], [1, 3, 11, 9], [4, 6, 14, 12], [5, 7, 15, 13],
    [0, 4, 12, 8], [1, 5, 13, 9], [2, 6, 14, 10], [3, 7, 15, 11]
];
