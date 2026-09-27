import type { WaterMapBControlPoint } from "./water-map-b-alignment-contract";

export type WaterMapBAffineTransform = {
  method: "affine_2d_control_points_v1";
  longitude: { a: number; b: number; c: number };
  latitude: { d: number; e: number; f: number };
  controlPointCount: number;
  rmseMeters: number;
  maxResidualMeters: number;
  residuals: Array<{
    controlPointId: string;
    predictedLongitude: number;
    predictedLatitude: number;
    residualMeters: number;
  }>;
};

function solve3x3(matrix: number[][], vector: number[]) {
  const augmented = matrix.map((row, index) => [...row, vector[index]]);

  for (let column = 0; column < 3; column += 1) {
    let pivot = column;

    for (let row = column + 1; row < 3; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) {
        pivot = row;
      }
    }

    if (Math.abs(augmented[pivot][column]) < 1e-12) {
      throw new Error("water_map_alignment_singular_control_points");
    }

    [augmented[column], augmented[pivot]] = [
      augmented[pivot],
      augmented[column],
    ];

    const divisor = augmented[column][column];
    for (let j = column; j < 4; j += 1) {
      augmented[column][j] /= divisor;
    }

    for (let row = 0; row < 3; row += 1) {
      if (row === column) continue;

      const factor = augmented[row][column];
      for (let j = column; j < 4; j += 1) {
        augmented[row][j] -= factor * augmented[column][j];
      }
    }
  }

  return [augmented[0][3], augmented[1][3], augmented[2][3]] as const;
}

function normalEquations(
  points: WaterMapBControlPoint[],
  target: (point: WaterMapBControlPoint) => number,
) {
  let sx2 = 0;
  let sy2 = 0;
  let sxy = 0;
  let sx = 0;
  let sy = 0;
  let st = 0;
  let sxt = 0;
  let syt = 0;

  for (const point of points) {
    sx2 += point.sourceX * point.sourceX;
    sy2 += point.sourceY * point.sourceY;
    sxy += point.sourceX * point.sourceY;
    sx += point.sourceX;
    sy += point.sourceY;

    const value = target(point);
    st += value;
    sxt += point.sourceX * value;
    syt += point.sourceY * value;
  }

  const n = points.length;

  return solve3x3(
    [
      [sx2, sxy, sx],
      [sxy, sy2, sy],
      [sx, sy, n],
    ],
    [sxt, syt, st],
  );
}

function haversineMeters(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number,
) {
  const earthRadiusMeters = 6371008.8;
  const toRadians = Math.PI / 180;
  const phi1 = lat1 * toRadians;
  const phi2 = lat2 * toRadians;
  const deltaPhi = (lat2 - lat1) * toRadians;
  const deltaLambda = (lon2 - lon1) * toRadians;

  const h =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) ** 2;

  return (
    2 *
    earthRadiusMeters *
    Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)))
  );
}

export function applyWaterMapBAffineTransform(
  transform: Pick<WaterMapBAffineTransform, "longitude" | "latitude">,
  sourceX: number,
  sourceY: number,
) {
  const longitude =
    transform.longitude.a * sourceX +
    transform.longitude.b * sourceY +
    transform.longitude.c;
  const latitude =
    transform.latitude.d * sourceX +
    transform.latitude.e * sourceY +
    transform.latitude.f;

  return { longitude, latitude };
}

export function invertWaterMapBAffineTransform(
  transform: Pick<WaterMapBAffineTransform, "longitude" | "latitude">,
  longitude: number,
  latitude: number,
) {
  const { a, b, c } = transform.longitude;
  const { d, e, f } = transform.latitude;
  const determinant = a * e - b * d;

  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-18) {
    throw new Error("water_map_alignment_transform_not_invertible");
  }

  const lon = longitude - c;
  const lat = latitude - f;

  const sourceX = (e * lon - b * lat) / determinant;
  const sourceY = (-d * lon + a * lat) / determinant;

  if (!Number.isFinite(sourceX) || !Number.isFinite(sourceY)) {
    throw new Error("water_map_alignment_inverse_not_finite");
  }

  return { sourceX, sourceY };
}

export function calculateWaterMapBAffineTransform(
  controlPoints: WaterMapBControlPoint[],
): WaterMapBAffineTransform {
  if (!Array.isArray(controlPoints) || controlPoints.length < 3) {
    throw new Error("water_map_alignment_insufficient_control_points");
  }

  for (const point of controlPoints) {
    if (
      ![
        point.sourceX,
        point.sourceY,
        point.longitude,
        point.latitude,
      ].every(Number.isFinite)
    ) {
      throw new Error("water_map_alignment_invalid_control_point");
    }
  }

  const [a, b, c] = normalEquations(
    controlPoints,
    (point) => point.longitude,
  );
  const [d, e, f] = normalEquations(
    controlPoints,
    (point) => point.latitude,
  );

  const transform = {
    longitude: { a, b, c },
    latitude: { d, e, f },
  };

  const residuals = controlPoints.map((point) => {
    const predicted = applyWaterMapBAffineTransform(
      transform,
      point.sourceX,
      point.sourceY,
    );

    return {
      controlPointId: point.id,
      predictedLongitude: predicted.longitude,
      predictedLatitude: predicted.latitude,
      residualMeters: haversineMeters(
        predicted.longitude,
        predicted.latitude,
        point.longitude,
        point.latitude,
      ),
    };
  });

  const squared = residuals.reduce(
    (sum, item) => sum + item.residualMeters ** 2,
    0,
  );
  const rmseMeters = Math.sqrt(squared / residuals.length);
  const maxResidualMeters = Math.max(
    ...residuals.map((item) => item.residualMeters),
  );

  if (
    ![a, b, c, d, e, f, rmseMeters, maxResidualMeters].every(Number.isFinite)
  ) {
    throw new Error("water_map_alignment_transform_not_finite");
  }

  return {
    method: "affine_2d_control_points_v1",
    longitude: { a, b, c },
    latitude: { d, e, f },
    controlPointCount: controlPoints.length,
    rmseMeters,
    maxResidualMeters,
    residuals,
  };
}
