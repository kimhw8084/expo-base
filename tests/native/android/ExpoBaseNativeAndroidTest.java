package com.expobase.reference;

import static androidx.test.platform.app.InstrumentationRegistry.getInstrumentation;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.content.Intent;
import android.graphics.Rect;
import android.os.Environment;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.BySelector;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.Until;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.File;
import java.util.Arrays;
import java.util.List;

@RunWith(AndroidJUnit4.class)
public final class ExpoBaseNativeAndroidTest {
  private static final String PACKAGE = "com.expobase.reference";
  private static final long WAIT_MS = 20_000L;

  private UiDevice device;
  private Context targetContext;

  @Before
  public void launchReleaseProduct() throws Exception {
    device = UiDevice.getInstance(getInstrumentation());
    targetContext = getInstrumentation().getTargetContext();
    device.setOrientationNatural();
    Intent intent = targetContext.getPackageManager().getLaunchIntentForPackage(PACKAGE);
    assertNotNull("The release application launch intent was not found.", intent);
    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
    targetContext.startActivity(intent);
    assertTarget("home-adaptive-section-header", "Home adaptive section");
  }

  @After
  public void restoreOrientation() throws Exception {
    device.setOrientationNatural();
  }

  @Test
  public void launchHomeAndPrimaryNavigation() {
    screenshot("home");
    clickTarget("navigation-item-build", "Build", "Build");
    assertTarget("adapter-form-sections", "Build form sections");
    clickTarget("navigation-item-data", "Data", "Data");
    assertTarget("card-data-toolbar", "Data workspace toolbar");
    clickTarget("navigation-item-patterns", "Patterns", "Patterns");
    assertTarget("golden-page-header-title", "Golden patterns page header");
    clickTarget("navigation-item-system", "System", "System");
    assertTarget("surface-card-default", "System default surface");
    clickTarget("navigation-item-home", "Home", "Home");
    assertTarget("home-adaptive-section-header", "Home adaptive section");
    screenshot("navigation");
  }

  @Test
  public void formInputKeyboardAndValidation() {
    clickHomeRoute("forms", "Forms");
    UiObject2 name = assertTarget("demo-name", "Full name field");
    name.click();
    assertTrue("The Android text field did not receive focus.", name.isFocused());
    name.setText("Native Test User");
    assertTrue("The Android text field did not retain typed text.", "Native Test User".equals(name.getText()));
    device.pressBack();
    assertTarget("adapter-form-sections", "Build form sections");
    clickTarget("adapter-form-validate", "Validate form", "Validate form");
    assertTarget("adapter-form-error-summary", "Form error summary");
    assertTarget("demo-email-error", "Email validation error");
    screenshot("forms");
  }

  @Test
  public void touchScrollReachesHomeContent() {
    int width = device.getDisplayWidth();
    int height = device.getDisplayHeight();
    device.swipe(width / 2, (int) (height * 0.35), width / 2, (int) (height * 0.75), 20);
    assertTarget("home-metric-group", "Home metrics");
    screenshot("scroll");
  }

  @Test
  public void orientationRoundTripPreservesHome() throws Exception {
    device.setOrientationLeft();
    assertTarget("home-adaptive-section-header", "Home adaptive section");
    device.setOrientationNatural();
    assertTarget("home-adaptive-section-header", "Home adaptive section");
    screenshot("orientation");
  }

  @Test
  public void overlayLifecycleAndSystemBack() {
    clickHomeRoute("overlays", "Overlays");
    clickTarget("overlay-action-menu-trigger", "Open action menu", "Open action menu");
    assertTarget("card-action-menu", "Card action menu");
    clickTarget(null, "Edit card", "Edit card");
    assertTargetAbsent("card-action-menu", "Card action menu");
    clickTarget("overlay-dialog-trigger", "Open dialog", "Open dialog");
    assertTarget("overlay-dialog-review-action", "Dialog review action");
    device.pressBack();
    assertTargetAbsent("overlay-dialog-review-action", "Dialog review action");
    clickTarget("overlay-bottom-sheet-trigger", "Open bottom sheet", "Open bottom sheet");
    assertTarget("bottom-sheet-panel", "Bottom sheet panel");
    device.pressBack();
    assertTargetAbsent("bottom-sheet-panel", "Bottom sheet panel");
    screenshot("overlays");
  }

  @Test
  public void flagshipDataAndServerStateRoutes() {
    clickHomeRoute("analytics-showcase", "Analytics showcase");
    assertTarget("analytics-page-header-title", "Analytics page header");
    clickTarget(null, "Home", "Home");
    clickHomeRoute("finance-showcase", "Finance showcase");
    assertTarget("finance-page-header-title", "Finance page header");
    clickTarget(null, "Home", "Home");
    clickHomeRoute("monitoring-showcase", "Monitoring showcase");
    assertTarget("monitoring-page-header-title", "Monitoring page header");
    clickTarget(null, "Home", "Home");
    clickTarget("navigation-item-data", "Data", "Data");
    assertTarget("card-data-toolbar", "Data workspace toolbar");
    UiObject2 row = assertTarget("card-data-table-compact-row-venture-x", "Venture X row");
    row.click();
    assertTarget("selected-record-details", "Selected record");
    clickTarget("navigation-item-data", "Data", "Data");
    clickTarget("navigation-item-home", "Home", "Home");
    clickHomeRoute("server-state", "Server state");
    assertTarget("server-state-load-count", "Service requests:");
    clickTarget("server-state-refresh", "Refresh tasks", "Refresh tasks");
    assertTarget("server-state-mutation-count", "Mutation requests");
    screenshot("flagship-data");
  }

  @Test
  public void runtimeThemeDensityLocaleAndMotionControls() {
    clickTarget(null, "Theme: Dark", "Theme: Dark");
    clickTarget(null, "Density: Compact", "Density: Compact");
    clickTarget(null, "Locale: Pseudo LTR", "Locale: Pseudo LTR");
    clickTarget(null, "Locale: Pseudo RTL", "Locale: Pseudo RTL");
    clickTarget(null, "Motion: Reduced", "Motion: Reduced");
    UiObject2 settings = assertTarget("runtime-settings-status", "Runtime settings status");
    assertTrue("Runtime settings did not retain dark/compact/reduced controls.", settings.getText().contains("Dark") && settings.getText().contains("Compact") && settings.getText().contains("reduced"));
    UiObject2 locale = assertTarget("runtime-locale-status", "Direction:");
    assertTrue("Runtime locale did not enter RTL mode.", locale.getText().contains("RTL"));
    screenshot("runtime-modes");
  }

  @Test
  public void lifecycleRelaunchRecoversHome() {
    device.pressHome();
    Intent intent = targetContext.getPackageManager().getLaunchIntentForPackage(PACKAGE);
    assertNotNull(intent);
    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
    targetContext.startActivity(intent);
    assertTarget("home-adaptive-section-header", "Home adaptive section");
    screenshot("lifecycle");
  }

  private UiObject2 assertTarget(String id, String description) {
    UiObject2 object = scrollToStableResource(id);
    assertNotNull("Missing Android resource-id target: " + id + " / " + description, object);
    assertTrue("Android resource-id target was not visible: " + id + " / " + description, visible(object));
    return object;
  }

  private void assertTargetAbsent(String id, String description) {
    assertTrue(
      "Android resource-id target remained after dismissal: " + id + " / " + description,
      device.wait(Until.gone(By.res(PACKAGE, id)), WAIT_MS)
    );
  }

  private void clickHomeRoute(String route, String label) {
    clickTarget("home-route-" + route, label, label);
  }

  private void clickTarget(String id, String description, String text) {
    UiObject2 object = scrollTo(id, description, text);
    assertNotNull("Android target was not reachable: " + id + " / " + description, object);
    object.click();
  }

  private UiObject2 scrollTo(String id, String description, String text) {
    if (id != null) return scrollToStableResource(id);
    return scrollToAccessibleTarget(description, text);
  }

  private UiObject2 scrollToStableResource(String id) {
    BySelector selector = By.res(PACKAGE, id);
    UiObject2 initial = device.wait(Until.findObject(selector), WAIT_MS);
    if (initial != null && visible(initial)) return initial;
    for (int attempt = 0; attempt < 20; attempt += 1) {
      UiObject2 object = device.findObject(selector);
      if (object != null && visible(object)) return object;
      int width = device.getDisplayWidth();
      int height = device.getDisplayHeight();
      device.swipe(width / 2, (int) (height * 0.78), width / 2, (int) (height * 0.28), 20);
    }
    return null;
  }

  private UiObject2 scrollToAccessibleTarget(String description, String text) {
    for (int attempt = 0; attempt < 20; attempt += 1) {
      UiObject2 object = locateAccessibleTarget(description, text);
      if (object != null && visible(object)) return object;
      int width = device.getDisplayWidth();
      int height = device.getDisplayHeight();
      device.swipe(width / 2, (int) (height * 0.78), width / 2, (int) (height * 0.28), 20);
    }
    return null;
  }

  private UiObject2 locateAccessibleTarget(String description, String text) {
    List<BySelector> selectors = Arrays.asList(
      description == null ? null : By.descContains(description),
      text == null ? null : By.textContains(text)
    );
    for (BySelector selector : selectors) {
      if (selector == null) continue;
      UiObject2 object = device.findObject(selector);
      if (object != null) return object;
    }
    return null;
  }

  private boolean visible(UiObject2 object) {
    Rect bounds = object.getVisibleBounds();
    return bounds.width() > 0 && bounds.height() > 0;
  }

  private void screenshot(String name) {
    File pictures = targetContext.getExternalFilesDir(Environment.DIRECTORY_PICTURES);
    assertNotNull("Android external evidence directory is unavailable.", pictures);
    File directory = new File(pictures, "expo-base-android-certification");
    assertTrue("Could not create Android evidence directory.", directory.mkdirs() || directory.isDirectory());
    File file = new File(directory, name + ".png");
    assertTrue("Could not capture Android screenshot " + name, device.takeScreenshot(file));
  }
}
