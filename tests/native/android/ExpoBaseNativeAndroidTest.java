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
    assertText("Universal application foundation");
  }

  @After
  public void restoreOrientation() throws Exception {
    device.setOrientationNatural();
  }

  @Test
  public void launchHomeAndPrimaryNavigation() {
    screenshot("home");
    clickTarget("navigation-item-build", "Build", "Build");
    assertText("Form interaction acceptance surface");
    clickTarget("navigation-item-data", "Data", "Data");
    assertText("Adaptive data workspace");
    clickTarget("navigation-item-patterns", "Patterns", "Patterns");
    assertText("Dashboard");
    clickTarget("navigation-item-system", "System", "System");
    assertText("System acceptance laboratory");
    clickTarget("navigation-item-home", "Home", "Home");
    assertText("Universal application foundation");
    screenshot("navigation");
  }

  @Test
  public void formInputKeyboardAndValidation() {
    clickHomeRoute("forms", "Forms");
    UiObject2 name = scrollTo("demo-name", "Full name", "Full name");
    name.click();
    assertTrue("The Android text field did not receive focus.", name.isFocused());
    name.setText("Native Test User");
    assertTrue("The Android text field did not retain typed text.", "Native Test User".equals(name.getText()));
    device.pressBack();
    assertText("Form interaction acceptance surface");
    clickTarget(null, "Validate form", "Validate form");
    assertText("Enter your email.");
    screenshot("forms");
  }

  @Test
  public void touchScrollReachesHomeContent() {
    scrollTo(null, "Target platforms", "Target platforms");
    assertText("Target platforms");
    screenshot("scroll");
  }

  @Test
  public void orientationRoundTripPreservesHome() throws Exception {
    device.setOrientationLeft();
    assertText("Universal application foundation");
    device.setOrientationNatural();
    assertText("Universal application foundation");
    screenshot("orientation");
  }

  @Test
  public void overlayLifecycleAndSystemBack() {
    clickHomeRoute("overlays", "Overlays");
    assertText("Overlay Manager acceptance surface");
    clickTarget("overlay-action-menu-trigger", "Open action menu", "Open action menu");
    assertText("General");
    clickTarget(null, "Edit card", "Edit card");
    clickTarget(null, "Open dialog", "Open dialog");
    assertText("Review this recommendation");
    device.pressBack();
    assertTrue("Android system back did not dismiss the dialog.", !hasText("Review this recommendation"));
    clickTarget(null, "Open bottom sheet", "Open bottom sheet");
    assertText("Quick actions");
    device.pressBack();
    assertTrue("Android system back did not dismiss the bottom sheet.", !hasText("Quick actions"));
    screenshot("overlays");
  }

  @Test
  public void flagshipDataAndServerStateRoutes() {
    clickHomeRoute("analytics-showcase", "Analytics showcase");
    assertText("A calm view of growth");
    clickTarget(null, "Home", "Home");
    clickHomeRoute("finance-showcase", "Finance showcase");
    assertText("Value, contribution, and control");
    clickTarget(null, "Home", "Home");
    clickHomeRoute("monitoring-showcase", "Monitoring showcase");
    assertText("Know what needs attention");
    clickTarget(null, "Home", "Home");
    clickTarget("navigation-item-data", "Data", "Data");
    assertText("Adaptive data workspace");
    UiObject2 row = scrollTo("card-data-table-compact-row-venture-x", "Venture X", "Venture X");
    row.click();
    assertTarget("selected-record-details", "Selected record");
    clickTarget("navigation-item-data", "Data", "Data");
    clickTarget("navigation-item-home", "Home", "Home");
    clickHomeRoute("server-state", "Server state");
    assertTarget("server-state-load-count", "Service requests:");
    assertText("Refresh tasks");
    screenshot("flagship-data");
  }

  @Test
  public void runtimeThemeDensityLocaleAndMotionControls() {
    clickTarget(null, "Theme: Dark", "Theme: Dark");
    clickTarget(null, "Density: Compact", "Density: Compact");
    clickTarget(null, "Locale: Pseudo LTR", "Locale: Pseudo LTR");
    clickTarget(null, "Locale: Pseudo RTL", "Locale: Pseudo RTL");
    clickTarget(null, "Motion: Reduced", "Motion: Reduced");
    UiObject2 settings = scrollTo("runtime-settings-status", "Active:", "Active:");
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
    assertText("Universal application foundation");
    screenshot("lifecycle");
  }

  private UiObject2 assertTarget(String id, String description) {
    UiObject2 object = scrollTo(id, description, description);
    assertNotNull("Missing Android semantic target: " + id + " / " + description, object);
    return object;
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
    for (int attempt = 0; attempt < 20; attempt += 1) {
      UiObject2 object = locate(id, description, text);
      if (object != null && visible(object)) return object;
      int width = device.getDisplayWidth();
      int height = device.getDisplayHeight();
      device.swipe(width / 2, (int) (height * 0.78), width / 2, (int) (height * 0.28), 20);
    }
    return null;
  }

  private UiObject2 locate(String id, String description, String text) {
    List<BySelector> selectors = Arrays.asList(
      id == null ? null : By.res(PACKAGE, id),
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

  private UiObject2 assertText(String value) {
    UiObject2 object = device.wait(Until.findObject(By.textContains(value)), WAIT_MS);
    assertNotNull("Expected Android text was not rendered: " + value, object);
    return object;
  }

  private boolean hasText(String value) {
    return device.findObject(By.textContains(value)) != null;
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
