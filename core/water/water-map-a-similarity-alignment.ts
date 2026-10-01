export type PantavionRigidControlPoint = {
  id: string;
  sourceX: number;
  sourceY: number;
  targetEasting: number;
  targetNorthing: number;
  provenance: string;
};

export type PantavionSimilarityTransform = {
  method: "similarity_2d_no_shear_v1";
  targetCrs: "EPSG:6312";
  a: number;
  b: number;
  tx: number;
  ty: number;
  scale: number;
  rotationRadians: number;
  controlPointCount: number;
  rmseMeters: number;
  maxResidualMeters: number;
  residuals: Array<{ controlPointId: string; residualMeters: number }>;
};

function finitePoint(p: PantavionRigidControlPoint) {
  return [p.sourceX,p.sourceY,p.targetEasting,p.targetNorthing].every(Number.isFinite);
}

/**
 * Least-squares 2D similarity (Helmert) transform.
 * X = a*x - b*y + tx
 * Y = b*x + a*y + ty
 *
 * A single uniform scale + rotation is used. No shear and no independent
 * X/Y scale are possible, so source network geometry is preserved.
 */
export function calculatePantavionMapASimilarityTransform(
  points: PantavionRigidControlPoint[],
): PantavionSimilarityTransform {
  if (!Array.isArray(points) || points.length < 2) {
    throw new Error("water_map_a_alignment_insufficient_control_points");
  }
  if (points.some((p) => !finitePoint(p) || !p.id || !p.provenance)) {
    throw new Error("water_map_a_alignment_invalid_control_point");
  }

  const n = points.length;
  const sx = points.reduce((s,p)=>s+p.sourceX,0)/n;
  const sy = points.reduce((s,p)=>s+p.sourceY,0)/n;
  const txc = points.reduce((s,p)=>s+p.targetEasting,0)/n;
  const tyc = points.reduce((s,p)=>s+p.targetNorthing,0)/n;

  let denominator=0, dot=0, cross=0;
  for (const p of points) {
    const x=p.sourceX-sx, y=p.sourceY-sy;
    const X=p.targetEasting-txc, Y=p.targetNorthing-tyc;
    denominator += x*x+y*y;
    dot += x*X+y*Y;
    cross += x*Y-y*X;
  }
  if (!Number.isFinite(denominator) || denominator <= 1e-12) {
    throw new Error("water_map_a_alignment_degenerate_control_points");
  }

  const a=dot/denominator;
  const b=cross/denominator;
  const tx=txc-a*sx+b*sy;
  const ty=tyc-b*sx-a*sy;
  const scale=Math.hypot(a,b);
  const rotationRadians=Math.atan2(b,a);

  if (![a,b,tx,ty,scale,rotationRadians].every(Number.isFinite) || scale<=0) {
    throw new Error("water_map_a_alignment_transform_not_finite");
  }

  const residuals=points.map((p)=>{
    const X=a*p.sourceX-b*p.sourceY+tx;
    const Y=b*p.sourceX+a*p.sourceY+ty;
    return {controlPointId:p.id,residualMeters:Math.hypot(X-p.targetEasting,Y-p.targetNorthing)};
  });
  const rmseMeters=Math.sqrt(residuals.reduce((s,r)=>s+r.residualMeters*r.residualMeters,0)/n);
  const maxResidualMeters=Math.max(...residuals.map(r=>r.residualMeters));

  return {
    method:"similarity_2d_no_shear_v1",
    targetCrs:"EPSG:6312",
    a,b,tx,ty,scale,rotationRadians,controlPointCount:n,
    rmseMeters,maxResidualMeters,residuals,
  };
}

export function applyPantavionMapASimilarityTransform(
  t: Pick<PantavionSimilarityTransform,"a"|"b"|"tx"|"ty">,
  sourceX:number,
  sourceY:number,
) {
  return {
    easting:t.a*sourceX-t.b*sourceY+t.tx,
    northing:t.b*sourceX+t.a*sourceY+t.ty,
  };
}
