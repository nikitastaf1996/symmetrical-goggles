package com.gpsrecorder

/**
 * O7 — Pure geodesy math extracted from GpsRecorderService.kt.
 *
 * These functions are stateless and side-effect-free, so they live in an
 * `object` (Kotlin's singleton) and can be called from anywhere without
 * instantiation. The service delegates to them via `TrackMath.xxx(...)`.
 *
 * Extracted from GpsRecorderService.kt to shrink that file (see TODO 4, O7).
 */
object TrackMath {

    /** Earth radius in meters (mean radius, WGS-84 approximation). */
    private const val EARTH_RADIUS_M = 6_371_000.0

    /**
     * Returns the great-circle distance between two lat/lon points in meters.
     * Uses the Haversine formula.
     */
    fun haversineMeters(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        val c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return EARTH_RADIUS_M * c
    }

    /**
     * Cross-track distance from point P to the great-circle path a → b, in
     * meters. Used by Douglas-Peucker to decide whether an intermediate
     * point is "close enough" to the segment to be discarded.
     *
     * L12 fix: degenerate segment (a and b coincide) returns 0.0 so
     * Douglas-Peucker drops all intermediate points in such a segment
     * (they can't be farther than epsilon from a meaningless segment).
     *
     * Formula (non-degenerate case):
     *   δ13 = d13 / R            (angular distance from a to p)
     *   θ13 = bearing(a → p)
     *   θ12 = bearing(a → b)
     *   d_xt = asin( sin(δ13) · sin(θ13 − θ12) ) · R
     */
    fun crossTrackDistanceM(
        pLat: Double, pLon: Double,
        aLat: Double, aLon: Double,
        bLat: Double, bLon: Double
    ): Double {
        if (aLat == bLat && aLon == bLon) {
            return 0.0
        }
        val d13 = haversineMeters(aLat, aLon, pLat, pLon) / EARTH_RADIUS_M
        if (d13 == 0.0) return 0.0
        val theta13 = bearingRad(aLat, aLon, pLat, pLon)
        val theta12 = bearingRad(aLat, aLon, bLat, bLon)
        // Clamp the asin argument to [-1.0, 1.0] to absorb floating-point
        // drift. Math.sin(d13) * Math.sin(theta13 - theta12) can evaluate
        // slightly outside the legal domain of asin when the point lies on
        // (or numerically coincides with) the great-circle arc, which would
        // otherwise make asin return NaN and poison the Douglas-Peucker
        // recursion downstream.
        val sinArg = Math.sin(d13) * Math.sin(theta13 - theta12)
        val clampedArg = sinArg.coerceIn(-1.0, 1.0)
        val dXt = Math.asin(clampedArg) * EARTH_RADIUS_M
        return Math.abs(dXt)
    }

    /** Initial bearing from (lat1, lon1) to (lat2, lon2), in radians. */
    fun bearingRad(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val phi1 = Math.toRadians(lat1)
        val phi2 = Math.toRadians(lat2)
        val dLambda = Math.toRadians(lon2 - lon1)
        val y = Math.sin(dLambda) * Math.cos(phi2)
        val x = Math.cos(phi1) * Math.sin(phi2) -
            Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda)
        return Math.atan2(y, x)
    }
}
