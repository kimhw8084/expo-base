package com.expobase.reference.certification;

import android.content.Context;
import android.content.Intent;
import android.graphics.Rect;
import android.os.SystemClock;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.BySelector;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.Until;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.regex.Pattern;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

@RunWith(AndroidJUnit4.class)
public final class ExpoBaseAndroidNativeTest {
    private static final long SCREEN_TIMEOUT_MS = 20_000;
    private static final long DISMISS_TIMEOUT_MS = 12_000;
    private static final String HOME_LANDMARK = "Universal application foundation";

    private UiDevice device;
    private Context targetContext;
    private String appPackage;

    @Before
    public void launchCleanReferenceApp() throws Exception {
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
        targetContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        appPackage = targetContext.getPackageName();
        device.wakeUp();
        device.setOrientationNatural();
        device.executeShellCommand("mkdir -p /sdcard/Download");
        launchApp();
        requireText(HOME_LANDMARK, SCREEN_TIMEOUT_MS);
    }

    @Test
    public void testColdLaunchFindsHomeAndCapturesEvidence() throws Exception {
        requireText(HOME_LANDMARK, SCREEN_TIMEOUT_MS);
        assertNull("Unknown selector sentinel unexpectedly matched the running app", device.findObject(id("__expo_base_absent_control__")));
        device.executeShellCommand("screencap -p /sdcard/Download/expo-base-android-home.png");
    }

    @Test
    public void testPrimaryNavigationAndOrdinaryScrolling() {
        assertNull("The forms field must not be exposed while home is active", device.findObject(id("demo-name")));

        tapId("navigation-item-build");
        requireId("demo-name");
        requireText("Form interaction acceptance surface", SCREEN_TIMEOUT_MS);

        tapId("navigation-item-data");
        requireText("Adaptive data workspace", SCREEN_TIMEOUT_MS);

        tapId("navigation-item-home");
        requireText(HOME_LANDMARK, SCREEN_TIMEOUT_MS);
        UiObject2 route = scrollUntilVisible("home-route-forms");
        route.click();
        requireText("Form interaction acceptance surface", SCREEN_TIMEOUT_MS);
        assertNull("The home route target must leave the active accessibility tree after navigation", device.findObject(id("home-route-forms")));
    }

    @Test
    public void testTextInputKeyboardValidationAndReachability() throws Exception {
        openHomeRoute("forms");
        UiObject2 nameField = requireId("demo-name");
        assertNull("Email validation error must be absent before form submission", device.findObject(id("demo-email-error")));
        nameField.click();
        assertTrue("The native form field did not receive focus", requireId("demo-name").isFocused());
        String imePackage = assertImeVisible();

        device.executeShellCommand("input text ExpoBase");
        assertTrue("Text sent through the active input method did not reach the controlled field", waitForIdText("demo-name", "ExpoBase", 5_000));
        device.pressBack();
        assertTrue("Android system Back did not dismiss the active input method", device.wait(Until.gone(By.pkg(imePackage)), DISMISS_TIMEOUT_MS));

        BySelector emailSummaryAction = id("form-error-summary-action-form-error-email");
        assertNull("The email validation action must be absent before invalid form submission", device.findObject(emailSummaryAction));
        scrollUntilVisible("text-pressure-form-submit").click();
        requireText("Review the highlighted fields", SCREEN_TIMEOUT_MS);
        String validationImePackage = assertImeVisible();
        device.pressBack();
        assertTrue("Android system Back did not dismiss the validation-focused input method", device.wait(Until.gone(By.pkg(validationImePackage)), DISMISS_TIMEOUT_MS));
        UiObject2 emailErrorAction = scrollTowardTopUntilVisible(emailSummaryAction, "email validation action");
        assertFalse("The email validation action has no visible native bounds", emailErrorAction.getVisibleBounds().isEmpty());
        device.executeShellCommand("screencap -p /sdcard/Download/expo-base-android-form-invalid.png");
        emailErrorAction.click();
        assertTrue("Validation did not focus the first invalid native field", waitForFocused("demo-email", 5_000));
    }

    @Test
    public void testMenuDialogSheetAndSystemBackLifecycle() throws Exception {
        openHomeRoute("overlays");
        assertNull("Closed action menu must not be observable", device.findObject(id("card-action-menu")));
        assertNull("Closed dialog action must not be observable", device.findObject(id("overlay-dialog-review")));
        assertNull("Closed sheet action must not be observable", device.findObject(id("overlay-sheet-compare")));
        assertNull("Closed menu action text must not be observable", device.findObject(By.text("Edit card")));

        tapId("overlay-action-menu-trigger");
        requireId("card-action-menu");
        UiObject2 editCard = requireText("Edit card", SCREEN_TIMEOUT_MS);
        assertFalse("The menu action has no visible native bounds", editCard.getVisibleBounds().isEmpty());
        editCard.click();
        assertTrue("The action menu remained open after its action", device.wait(Until.gone(id("card-action-menu")), DISMISS_TIMEOUT_MS));
        assertTrue("The selected menu action remained observable after menu dismissal", device.wait(Until.gone(By.text("Edit card")), DISMISS_TIMEOUT_MS));
        requireId("overlay-action-menu-trigger");

        tapId("overlay-dialog-open");
        UiObject2 review = requireId("overlay-dialog-review");
        assertEquals("The modal control did not expose its native testID resource name", "overlay-dialog-review", review.getResourceName());
        assertFalse("The modal action has no visible native bounds", review.getVisibleBounds().isEmpty());
        device.executeShellCommand("screencap -p /sdcard/Download/expo-base-android-dialog-open.png");
        review.click();
        assertTrue("The dialog action remained after activation", device.wait(Until.gone(id("overlay-dialog-review")), DISMISS_TIMEOUT_MS));
        requireId("overlay-dialog-open");

        tapId("overlay-dialog-open");
        requireId("overlay-dialog-review");
        device.pressBack();
        assertTrue("Android system Back did not dismiss the React Native dialog", device.wait(Until.gone(id("overlay-dialog-review")), DISMISS_TIMEOUT_MS));
        requireId("overlay-dialog-open");

        assertNull("The closed sheet action unexpectedly remained visible", device.findObject(id("overlay-sheet-compare")));
        tapId("overlay-sheet-open");
        UiObject2 compare = requireId("overlay-sheet-compare");
        assertEquals("The sheet control did not expose its native testID resource name", "overlay-sheet-compare", compare.getResourceName());
        compare.click();
        assertTrue("The sheet action remained after activation", device.wait(Until.gone(id("overlay-sheet-compare")), DISMISS_TIMEOUT_MS));
        requireId("overlay-sheet-open");

        tapId("overlay-sheet-open");
        requireId("overlay-sheet-compare");
        device.pressBack();
        assertTrue("Android system Back did not dismiss the React Native bottom sheet", device.wait(Until.gone(id("overlay-sheet-compare")), DISMISS_TIMEOUT_MS));
        requireId("overlay-sheet-open");
    }

    @Test
    public void testDataServerStateAndGoldenPlusRoutes() {
        tapId("navigation-item-data");
        UiObject2 row = scrollUntilVisible("card-data-table-compact-row-venture-x");
        assertNull("Record details must be absent before row selection", device.findObject(id("selected-record-details")));
        row.click();
        scrollUntilVisible("selected-record-details");

        tapId("navigation-item-home");
        openHomeRoute("server-state");
        BySelector refreshFailure = By.text("Showing previously loaded data because the latest refresh failed.");
        assertNull("The refresh failure presentation must be absent before a refresh", device.findObject(refreshFailure));
        UiObject2 failNextRefresh = scrollUntilVisible(By.desc("Fail next refresh"), "Fail next refresh");
        assertFalse("Server-state refresh action has no visible native bounds", failNextRefresh.getVisibleBounds().isEmpty());
        failNextRefresh.click();
        UiObject2 retainedDataFailure = waitFor(refreshFailure, SCREEN_TIMEOUT_MS);
        assertFalse("The server-state refresh result has no visible native bounds", retainedDataFailure.getVisibleBounds().isEmpty());
        UiObject2 retainedTask = scrollTowardTopUntilVisible(By.text("Publish Golden Catalog"), "retained server-state task");
        assertFalse("The refresh failure did not keep prior task content reachable", retainedTask.getVisibleBounds().isEmpty());
        device.executeShellCommand("screencap -p /sdcard/Download/expo-base-android-server-state-refresh-error.png");

        tapId("navigation-item-home");
        openHomeRoute("golden-plus");
        scrollUntilVisible(By.text("Relationship view"), "Advanced visualization landmark");
    }

    @Test
    public void testFlagshipRoutesRender() {
        String[][] routes = {
            {"analytics-showcase", "A calm view of growth"},
            {"finance-showcase", "Value, contribution, and control"},
            {"monitoring-showcase", "Know what needs attention"}
        };
        for (String[] route : routes) {
            assertNull("Flagship landmark must not be exposed before its route opens: " + route[1], device.findObject(By.text(route[1])));
            openHomeRoute(route[0]);
            requireText(route[1], SCREEN_TIMEOUT_MS);
            tapId("navigation-item-home");
            requireText(HOME_LANDMARK, SCREEN_TIMEOUT_MS);
        }
    }

    @Test
    public void testRuntimeThemeDensityLocaleRtlAndMotionControls() {
        scrollUntilVisible(By.text("Theme"), "Runtime controls heading");
        tapDescription("Theme: Dark");
        tapDescription("Density: Compact");
        tapDescription("Locale: Pseudo LTR");
        tapDescription("Locale: Pseudo RTL");
        tapDescription("Motion: Reduced");

        scrollUntilVisible("runtime-settings-status");
        assertTrue("Runtime setting state did not reflect all selected controls", waitForTextContent(
            "runtime-settings-status", new String[] {"Dark theme", "Compact density", "en-XB", "RTL", "reduced motion"}, SCREEN_TIMEOUT_MS));
        assertTrue("Runtime locale state did not expose the active RTL direction", waitForTextContent(
            "runtime-locale-status", new String[] {"Pseudo-localized", "RTL"}, SCREEN_TIMEOUT_MS));
        UiObject2 settings = requireId("runtime-settings-status");
        assertFalse("Runtime theme/density/motion controls retained their prior values", settings.getText().contains("System theme") || settings.getText().contains("Comfortable density") || settings.getText().contains("system motion"));
        assertFalse("Runtime locale control retained its product-locale state", requireId("runtime-locale-status").getText().contains("Product locale"));
    }

    @Test
    public void testOrientationRoundTrip() throws Exception {
        device.setOrientationLeft();
        requireText(HOME_LANDMARK, SCREEN_TIMEOUT_MS);
        requireId("navigation-item-home");
        device.setOrientationNatural();
        requireText(HOME_LANDMARK, SCREEN_TIMEOUT_MS);
        requireId("navigation-item-home");
    }

    @Test
    public void testLifecycleRelaunchAndRecovery() throws Exception {
        requireText(HOME_LANDMARK, SCREEN_TIMEOUT_MS);
        tapId("navigation-item-data");
        requireText("Adaptive data workspace", SCREEN_TIMEOUT_MS);
        device.pressHome();
        launchApp();
        requireText(HOME_LANDMARK, SCREEN_TIMEOUT_MS);
        assertNull("The cleared task retained its previous data route", device.findObject(By.text("Adaptive data workspace")));
        requireId("navigation-item-home");

        tapId("navigation-item-build");
        requireId("demo-name");
        device.pressHome();
        launchApp();
        requireText(HOME_LANDMARK, SCREEN_TIMEOUT_MS);
        assertNull("The relaunched task retained its previous form route", device.findObject(id("demo-name")));
        requireId("navigation-item-home");
    }

    private void launchApp() {
        Intent launchIntent = targetContext.getPackageManager().getLaunchIntentForPackage(appPackage);
        assertNotNull("The generated reference application has no launcher activity", launchIntent);
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        targetContext.startActivity(launchIntent);
    }

    private void openHomeRoute(String route) {
        UiObject2 target = scrollUntilVisible("home-route-" + route);
        assertFalse("Home route " + route + " has no visible touch target", target.getVisibleBounds().isEmpty());
        target.click();
    }

    private UiObject2 scrollUntilVisible(String testId) {
        return scrollUntilVisible(id(testId), testId);
    }

    private UiObject2 scrollUntilVisible(BySelector selector, String description) {
        UiObject2 target = device.findObject(selector);
        for (int swipe = 0; (target == null || target.getVisibleBounds().isEmpty()) && swipe < 16; swipe++) {
            int width = device.getDisplayWidth();
            int height = device.getDisplayHeight();
            assertTrue("The ordinary vertical touch gesture was rejected", device.swipe(width / 2, height * 4 / 5, width / 2, height / 3, 24));
            device.waitForIdle(3_000);
            target = device.findObject(selector);
        }
        assertNotNull("Could not scroll to native target " + description, target);
        Rect bounds = target.getVisibleBounds();
        assertFalse("Native target " + description + " remained outside the viewport", bounds.isEmpty());
        return target;
    }

    private UiObject2 scrollTowardTopUntilVisible(BySelector selector, String description) {
        UiObject2 target = device.findObject(selector);
        for (int swipe = 0; (target == null || target.getVisibleBounds().isEmpty()) && swipe < 16; swipe++) {
            int width = device.getDisplayWidth();
            int height = device.getDisplayHeight();
            assertTrue("The upward content gesture was rejected while moving toward " + description, device.swipe(width / 2, height / 3, width / 2, height * 4 / 5, 24));
            device.waitForIdle(3_000);
            target = device.findObject(selector);
        }
        assertNotNull("Could not scroll toward the top and observe native target " + description, target);
        Rect bounds = target.getVisibleBounds();
        assertFalse("Native target " + description + " remained outside the viewport after scrolling toward the top", bounds.isEmpty());
        return target;
    }

    private UiObject2 tapId(String testId) {
        UiObject2 target = requireId(testId);
        assertFalse("Native target " + testId + " is not visible", target.getVisibleBounds().isEmpty());
        target.click();
        return target;
    }

    private UiObject2 requireId(String testId) {
        UiObject2 target = waitFor(id(testId), SCREEN_TIMEOUT_MS);
        assertEquals("Unexpected native resource name for testID " + testId, testId, target.getResourceName());
        return target;
    }

    private UiObject2 requireText(String text, long timeoutMs) {
        return waitFor(By.text(text), timeoutMs);
    }

    private UiObject2 waitFor(BySelector selector, long timeoutMs) {
        UiObject2 target = device.wait(Until.findObject(selector), timeoutMs);
        assertNotNull("Native UI target was not observable for selector " + selector, target);
        return target;
    }

    private BySelector id(String testId) {
        return By.res(Pattern.compile("^" + Pattern.quote(testId) + "$"));
    }

    private void tapDescription(String description) {
        UiObject2 target = scrollUntilVisible(By.desc(description), description);
        assertFalse("Control " + description + " has no visible native bounds", target.getVisibleBounds().isEmpty());
        target.click();
    }

    private String assertImeVisible() throws Exception {
        String defaultInputMethod = device.executeShellCommand("settings get secure default_input_method").trim();
        assertTrue("The emulator did not report an active Android input method", defaultInputMethod.contains("/"));
        String imePackage = defaultInputMethod.substring(0, defaultInputMethod.indexOf('/'));
        assertNotNull("The Android input method window did not become observable after field focus", device.wait(Until.findObject(By.pkg(imePackage)), SCREEN_TIMEOUT_MS));
        return imePackage;
    }

    private boolean waitForFocused(String testId, long timeoutMs) {
        long deadline = SystemClock.uptimeMillis() + timeoutMs;
        while (SystemClock.uptimeMillis() < deadline) {
            UiObject2 target = device.findObject(id(testId));
            if (target != null && target.isFocused()) return true;
            SystemClock.sleep(200);
        }
        return false;
    }

    private boolean waitForIdText(String testId, String substring, long timeoutMs) {
        long deadline = SystemClock.uptimeMillis() + timeoutMs;
        while (SystemClock.uptimeMillis() < deadline) {
            UiObject2 target = device.findObject(id(testId));
            if (target != null && target.getText() != null && target.getText().contains(substring)) return true;
            SystemClock.sleep(200);
        }
        return false;
    }

    private boolean waitForTextContent(String testId, String[] expectedParts, long timeoutMs) {
        long deadline = SystemClock.uptimeMillis() + timeoutMs;
        while (SystemClock.uptimeMillis() < deadline) {
            UiObject2 target = device.findObject(id(testId));
            String text = target == null ? null : target.getText();
            boolean matches = text != null;
            for (String part : expectedParts) matches &= text != null && text.contains(part);
            if (matches) return true;
            SystemClock.sleep(250);
        }
        return false;
    }
}
