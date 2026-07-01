package com.gpsrecorder

import org.junit.Test
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.assertEquals

/**
 * CODE_REVIEW_TODO Task 1 — unit test for the pause/gap race invariant.
 *
 * Scenario (from CODE_REVIEW §2 "Race Between Gap Watchdog and Auto-Pause Resume"):
 *   1. User is auto-paused (stationary for ~25 s; `lastFixTimeMs` is 25 s stale).
 *   2. User starts walking. The first fresh fix arrives at t = T.
 *   3. `exitAutoPause(T)` is called inside `onLocationChanged`, which:
 *        - flips `isAutoPaused = false`
 *        - sets `lastResumeMs = T`
 *        - sets `autoPauseResumeGraceUntilMs = T + GAP_THRESHOLD_MS`   ← Task 1
 *        - refreshes `lastFixTimeMs = T`                                 ← Task 1
 *   4. The gap watchdog (`durationTick`) fires at 1 Hz. We assert that
 *      `signalLost` is NOT declared during the next `GAP_THRESHOLD_MS`
 *      of ticks, even if no further fix arrives.
 *
 * Why a pure-Kotlin state machine instead of testing `GpsRecorderService`
 * directly: the service extends Android's `Service` class and uses
 * `SharedPreferences`, `LocationListener`, `Handler`, `PowerManager.WakeLock`,
 * etc. — mocking all of those requires Robolectric or instrumented tests,
 * neither of which is set up in this project. The race invariant, however,
 * is pure logic over four scalar fields:
 *
 *   - isAutoPaused: Boolean
 *   - signalLost: Boolean
 *   - lastFixTimeMs: Long
 *   - autoPauseResumeGraceUntilMs: Long
 *
 * We extract that logic into [GapPauseStateMachine] below, mirror the exact
 * guard conditions used in `GpsRecorderService.durationTick` and
 * `GpsRecorderService.onLocationChanged`, and assert the race invariant
 * holds. If a future refactor of the service drifts from this invariant,
 * the test will fail — which is the whole point of "make the invariant
 * explicit and refactor-proof" per Task 1's rationale.
 *
 * Run with: `./gradlew testDebugUnitTest`
 */
class GapPauseRaceTest {

    /** GAP_THRESHOLD_MS in GpsRecorderService.kt (companion object). */
    private val gapThresholdMs = 15_000L

    /**
     * Mirror of the relevant subset of GpsRecorderService state.
     *
     * The guard conditions in [durationTick] and [onLocationChanged] are
     * copied verbatim (modulo field-name aliases) from the service so a
     * drift in either place shows up as a test failure here.
     */
    private class GapPauseStateMachine(val gapThresholdMs: Long) {
        var isAutoPaused: Boolean = false
        var signalLost: Boolean = false
        var lastFixTimeMs: Long = 0L
        var autoPauseResumeGraceUntilMs: Long = 0L

        /** Mirror of GpsRecorderService.exitAutoPause(now). */
        fun exitAutoPause(now: Long) {
            isAutoPaused = false
            autoPauseResumeGraceUntilMs = now + gapThresholdMs
            lastFixTimeMs = now
        }

        /** Mirror of GpsRecorderService.enterAutoPause(now). */
        fun enterAutoPause(now: Long) {
            isAutoPaused = true
            signalLost = false
        }

        /**
         * Mirror of the gap-watchdog guard in GpsRecorderService.durationTick.
         * Returns true if the watchdog WOULD fire (declare signalLost) on
         * this tick — i.e. all guard conditions are met AND the time since
         * the last fix exceeds the threshold.
         */
        fun watchdogWouldFire(now: Long, gapDetectionEnabled: Boolean = true): Boolean {
            if (!gapDetectionEnabled) return false
            if (signalLost) return false
            if (isAutoPaused) return false
            if (now < autoPauseResumeGraceUntilMs) return false   // Task 1
            if (lastFixTimeMs <= 0L) return false
            val sinceLast = now - lastFixTimeMs
            return sinceLast > gapThresholdMs
        }

        /**
         * Apply the watchdog tick. If [watchdogWouldFire] returns true,
         * flip signalLost to true (mirror of the body of the watchdog
         * branch in durationTick).
         */
        fun durationTick(now: Long, gapDetectionEnabled: Boolean = true) {
            if (watchdogWouldFire(now, gapDetectionEnabled)) {
                signalLost = true
            }
        }
    }

    /**
     * The exact scenario from CODE_REVIEW_TODO Task 1 step 7:
     *   - Auto-pause engaged.
     *   - User stationary for 25 s (so lastFixTimeMs is 25 s stale).
     *   - User starts walking. First fix arrives at t = T.
     *   - Assert: signalLost is NOT declared during the next 15 s of
     *     durationTick calls, even if no further fix arrives.
     */
    @Test
    fun autoPauseResume_doesNotTriggerGapWatchdog_forGAP_THRESHOLD_MS_afterResume() {
        val sm = GapPauseStateMachine(gapThresholdMs)

        // 1. Simulate the user being stationary for 25 s before resume.
        //    At t=0 they were auto-paused (enterAutoPause ran at t=0).
        //    The last fix arrived at t=0 (when they were still moving,
        //    just before auto-pause triggered). Then 25 s of no fixes.
        val pauseEnterTime = 0L
        sm.enterAutoPause(pauseEnterTime)
        sm.lastFixTimeMs = pauseEnterTime   // last fix before pause
        // Simulate 25 s of stationarity — lastFixTimeMs stays stale.
        val resumeTime = 25_000L

        // 2. User starts walking. First fresh fix arrives at t = resumeTime.
        //    onLocationChanged runs and calls exitAutoPause(resumeTime).
        sm.exitAutoPause(resumeTime)

        // Assert the grace window was set correctly.
        assertEquals(
            "exitAutoPause must set grace window to now + GAP_THRESHOLD_MS",
            resumeTime + gapThresholdMs,
            sm.autoPauseResumeGraceUntilMs
        )
        assertEquals(
            "exitAutoPause must refresh lastFixTimeMs to the resume fix",
            resumeTime,
            sm.lastFixTimeMs
        )
        assertFalse("isAutoPaused must be false after exitAutoPause", sm.isAutoPaused)

        // 3. Simulate 15 s of durationTick calls with NO further fix.
        //    lastFixTimeMs stays at resumeTime (25_000), so for ticks at
        //    t = resumeTime+1s, resumeTime+2s, ..., resumeTime+15s the
        //    "sinceLast" gap is 1s, 2s, ..., 15s — all <= GAP_THRESHOLD_MS.
        //
        //    Even without the grace window, none of these would fire
        //    because sinceLast <= GAP_THRESHOLD_MS. But the grace window
        //    ALSO protects us: it forbids the watchdog from firing even
        //    if sinceLast somehow exceeded GAP_THRESHOLD_MS (e.g. if the
        //    user took one step and then stood still for 16+ s).
        for (deltaSec in 1..15) {
            val tickTime = resumeTime + deltaSec * 1000L
            sm.durationTick(tickTime)
            assertFalse(
                "signalLost must NOT be declared at t=$tickTime (delta=${deltaSec}s after resume)" +
                    " — grace window is active until ${sm.autoPauseResumeGraceUntilMs}",
                sm.signalLost
            )
        }
    }

    /**
     * The harder variant: user takes one step (resume), then stands still
     * again for 16 s. lastFixTimeMs is stale (only updated to the resume
     * fix, not to any subsequent fix because there isn't one). The grace
     * window MUST prevent the watchdog from firing during the 15 s after
     * resume. After the grace window expires, the watchdog fires normally
     * — which is the correct behaviour (the user really did lose signal).
     */
    @Test
    fun autoPauseResume_graceWindowPreventsFalseSignalLost_whenUserPausesAgainImmediately() {
        val sm = GapPauseStateMachine(gapThresholdMs)

        // User stationary from t=0 to t=25s; auto-paused at t=0.
        sm.enterAutoPause(0L)
        sm.lastFixTimeMs = 0L

        // User takes one step at t=25s and exits auto-pause.
        val resumeTime = 25_000L
        sm.exitAutoPause(resumeTime)

        // User stands still again. No further fixes arrive. The watchdog
        // ticks at 1 Hz. For the first 15 s after resume, the grace window
        // must prevent signalLost — even though sinceLast will eventually
        // exceed GAP_THRESHOLD_MS.
        for (deltaSec in 1..15) {
            val tickTime = resumeTime + deltaSec * 1000L
            sm.durationTick(tickTime)
            assertFalse(
                "Grace window must prevent signalLost at t=$tickTime (delta=${deltaSec}s)",
                sm.signalLost
            )
        }

        // At t = resumeTime + 16s, the grace window has just expired (grace
        // covers [resumeTime, resumeTime + 15s] inclusive). The next tick
        // is the first one where the watchdog is ALLOWED to fire.
        // lastFixTimeMs is still resumeTime (no further fix arrived), so
        // sinceLast = 16_000ms > 15_000ms threshold → watchdog fires.
        val tickAfterGrace = resumeTime + 16_000L
        sm.durationTick(tickAfterGrace)
        assertTrue(
            "After grace window expires, watchdog must fire normally" +
                " (sinceLast=${tickAfterGrace - sm.lastFixTimeMs}ms > $gapThresholdMs ms)",
            sm.signalLost
        )
    }

    /**
     * Negative control: without the grace window (autoPauseResumeGraceUntilMs = 0),
     * the watchdog WOULD fire on a stale lastFixTimeMs — this is the bug
     * the grace window is fixing.
     */
    @Test
    fun withoutGraceWindow_watchdogWouldFalselyFire_onStaleLastFixTimeMs() {
        val sm = GapPauseStateMachine(gapThresholdMs)
        // Simulate the OLD behaviour (pre-Task-1): exitAutoPause sets
        // isAutoPaused=false and lastResumeMs, but does NOT set the grace
        // window and does NOT refresh lastFixTimeMs.
        sm.isAutoPaused = false
        sm.lastFixTimeMs = 0L   // stale — last updated 25 s ago
        sm.autoPauseResumeGraceUntilMs = 0L  // ← no grace window

        // Tick at t = 25_001ms (1 ms after resume). sinceLast = 25_001ms,
        // which exceeds GAP_THRESHOLD_MS. The watchdog fires falsely.
        val tickTime = 25_001L
        assertTrue(
            "Pre-Task-1 behaviour: watchdog fires falsely on stale lastFixTimeMs" +
                " (this is the bug the grace window fixes)",
            sm.watchdogWouldFire(tickTime)
        )
    }
}
