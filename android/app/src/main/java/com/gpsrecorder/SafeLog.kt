package com.gpsrecorder

import android.util.Log

/**
 * SafeLog — privacy-preserving logging helper.
 *
 * L33 fix: GPS coordinates (lat / lon / d / v) were being logged via
 * `Log.d` / `Log.v` in release builds because `minifyEnabled = false` left
 * them in the APK. Any app with `READ_LOGS` (or `adb logcat`) could read
 * the user's GPS track from logcat — a real privacy leak.
 *
 * `d` and `v` are gated on `BuildConfig.DEBUG` so they are no-ops in
 * release builds. The string argument is still constructed at the call
 * site (Kotlin does not do dead-code elimination by default), but the
 * actual `Log.d` / `Log.v` call is skipped — so nothing reaches logcat
 * in release.
 *
 * `i` / `w` / `e` are kept unconditional because they are rare in this
 * codebase and useful for production debugging (e.g. "Signal lost:
 * no fix for Xms"). They do NOT include raw lat / lon / d / v data —
 * only summary messages. Audit each `Log.i` call site when adding new
 * ones; if it would leak coordinates, downgrade it to `SafeLog.d`.
 */
object SafeLog {
    @JvmStatic
    fun d(tag: String, msg: String) {
        if (BuildConfig.DEBUG) Log.d(tag, msg)
    }

    @JvmStatic
    fun v(tag: String, msg: String) {
        if (BuildConfig.DEBUG) Log.v(tag, msg)
    }

    // i / w / e are unconditional (no BuildConfig.DEBUG gate). They are
    // reserved for messages that are safe to log in release — i.e. NOT
    // containing lat / lon / d / v data. Use them for lifecycle events,
    // errors, and summary counts.
    @JvmStatic
    fun i(tag: String, msg: String) { Log.i(tag, msg) }

    @JvmStatic
    fun w(tag: String, msg: String) { Log.w(tag, msg) }

    @JvmStatic
    fun w(tag: String, msg: String, throwable: Throwable) { Log.w(tag, msg, throwable) }

    @JvmStatic
    fun e(tag: String, msg: String) { Log.e(tag, msg) }

    @JvmStatic
    fun e(tag: String, msg: String, throwable: Throwable) { Log.e(tag, msg, throwable) }
}
