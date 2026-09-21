package com.expobase.reference;

import static androidx.test.platform.app.InstrumentationRegistry.getInstrumentation;
import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.action.ViewActions.click;
import static androidx.test.espresso.action.ViewActions.closeSoftKeyboard;
import static androidx.test.espresso.action.ViewActions.replaceText;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.assertion.ViewAssertions.doesNotExist;
import static org.hamcrest.Matchers.allOf;
import static androidx.test.espresso.matcher.ViewMatchers.hasFocus;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom;
import static androidx.test.espresso.matcher.ViewMatchers.isEnabled;
import static androidx.test.espresso.matcher.ViewMatchers.withTagValue;
import static androidx.test.espresso.matcher.ViewMatchers.withText;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.content.Intent;
import android.graphics.Rect;
import android.os.Environment;
import android.view.View;
import android.view.ViewParent;
import android.widget.ScrollView;

import androidx.test.espresso.AmbiguousViewMatcherException;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.espresso.UiController;
import androidx.test.espresso.ViewAction;
import androidx.test.espresso.ViewInteraction;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.BySelector;
import androidx.test.uiautomator.Direction;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.hamcrest.Description;
import org.hamcrest.Matcher;
import org.hamcrest.TypeSafeMatcher;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

@RunWith(AndroidJUnit4.class)
public final class ExpoBaseNativeAndroidTest {
  private static final String PACKAGE = "com.expobase.reference";
  private static final long WAIT_MS = 20_000L;
  private static final long POLL_MS = 500L;
  private static final int MAX_SCROLL_ATTEMPTS = (int) (WAIT_MS / POLL_MS);
  private static final int MAX_NO_PROGRESS_ATTEMPTS = 3;
  private static final float UI_AUTOMATOR_SCROLL_PERCENT = 0.8f;

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
    assertTestIdVisible("home-adaptive-section-header", "Home adaptive section");
  }

  @After
  public void restoreOrientation() throws Exception {
    device.setOrientationNatural();
  }

  @Test
  public void launchHomeAndPrimaryNavigation() {
    screenshot("home");
    clickTestId("navigation-item-build", "Build");
    assertTestIdVisible("adapter-form-sections", "Build form sections");
    clickTestId("navigation-item-data", "Data");
    assertTestIdVisible("card-data-toolbar", "Data workspace toolbar");
    clickTestId("navigation-item-patterns", "Patterns");
    assertTestIdVisible("golden-page-header-title", "Golden patterns page header");
    clickTestId("navigation-item-system", "System");
    assertTestIdVisible("surface-card-default", "System default surface");
    clickTestId("navigation-item-home", "Home");
    assertTestIdVisible("home-adaptive-section-header", "Home adaptive section");
    screenshot("navigation");
  }

  @Test
  public void formInputKeyboardAndValidation() {
    clickHomeRoute("forms", "Forms");
    ViewInteraction name = assertTestIdVisible("demo-name", "Full name field");
    name.perform(click());
    name.check(matches(hasFocus()));
    replaceTextTestId("demo-name", "Native Test User");
    assertTestIdTextContains("demo-name", "Native Test User", "Full name field");
    device.pressBack();
    assertTestIdVisible("adapter-form-sections", "Build form sections");
    clickTestId("adapter-form-validate", "Validate form");
    assertTestIdVisible("adapter-form-error-summary", "Form error summary");
    assertTestIdVisible("demo-email-error", "Email validation error");
    screenshot("forms");
  }

  @Test
  public void touchScrollReachesHomeContent() {
    int width = device.getDisplayWidth();
    int height = device.getDisplayHeight();
    device.swipe(width / 2, (int) (height * 0.78), width / 2, (int) (height * 0.28), 20);
    assertTestIdVisible("home-metric-group", "Home metrics");
    screenshot("scroll");
  }

  @Test
  public void orientationRoundTripPreservesHome() throws Exception {
    device.setOrientationLeft();
    assertTestIdVisible("home-adaptive-section-header", "Home adaptive section");
    device.setOrientationNatural();
    assertTestIdVisible("home-adaptive-section-header", "Home adaptive section");
    screenshot("orientation");
  }

  @Test
  public void overlayLifecycleAndSystemBack() {
    clickHomeRoute("overlays", "Overlays");
    clickTestId("overlay-action-menu-trigger", "Open action menu");
    assertTestIdVisible("card-action-menu", "Card action menu");
    clickAccessibleTarget("Edit card", "Edit card");
    assertTestIdAbsent("card-action-menu", "Card action menu");
    clickTestId("overlay-dialog-trigger", "Open dialog");
    assertTestIdVisible("overlay-dialog-review-action", "Dialog review action");
    device.pressBack();
    assertTestIdAbsent("overlay-dialog-review-action", "Dialog review action");
    clickTestId("overlay-bottom-sheet-trigger", "Open bottom sheet");
    assertTestIdVisible("bottom-sheet-panel", "Bottom sheet panel");
    device.pressBack();
    assertTestIdAbsent("bottom-sheet-panel", "Bottom sheet panel");
    screenshot("overlays");
  }

  @Test
  public void flagshipDataAndServerStateRoutes() {
    clickHomeRoute("analytics-showcase", "Analytics showcase");
    assertTestIdVisible("analytics-page-header-title", "Analytics page header");
    clickTestId("navigation-item-home", "Home");
    clickHomeRoute("finance-showcase", "Finance showcase");
    assertTestIdVisible("finance-page-header-title", "Finance page header");
    clickTestId("navigation-item-home", "Home");
    clickHomeRoute("monitoring-showcase", "Monitoring showcase");
    assertTestIdVisible("monitoring-page-header-title", "Monitoring page header");
    clickTestId("navigation-item-home", "Home");
    clickTestId("navigation-item-data", "Data");
    assertTestIdVisible("card-data-toolbar", "Data workspace toolbar");
    clickTestId("card-data-table-compact-row-venture-x", "Venture X row");
    assertTestIdVisible("selected-record-details", "Selected record");
    clickTestId("navigation-item-data", "Data");
    clickTestId("navigation-item-home", "Home");
    clickHomeRoute("server-state", "Server state");
    assertTestIdTextContains("server-state-load-count", "Service requests:", "Server state load count");
    clickTestId("server-state-refresh", "Refresh tasks");
    assertTestIdTextContains("server-state-mutation-count", "Mutation requests", "Server state mutation count");
    screenshot("flagship-data");
  }

  @Test
  public void runtimeThemeDensityLocaleAndMotionControls() {
    clickAccessibleTarget("Theme: Dark", "Theme: Dark");
    clickAccessibleTarget("Density: Compact", "Density: Compact");
    clickAccessibleTarget("Locale: Pseudo LTR", "Locale: Pseudo LTR");
    clickAccessibleTarget("Locale: Pseudo RTL", "Locale: Pseudo RTL");
    clickAccessibleTarget("Motion: Reduced", "Motion: Reduced");
    assertTestIdTextContains("runtime-settings-status", "Dark", "Runtime settings status");
    assertTestIdTextContains("runtime-settings-status", "Compact", "Runtime settings status");
    assertTestIdTextContains("runtime-settings-status", "reduced", "Runtime settings status");
    assertTestIdTextContains("runtime-locale-status", "RTL", "Runtime locale status");
    screenshot("runtime-modes");
  }

  @Test
  public void lifecycleRelaunchRecoversHome() {
    device.pressHome();
    Intent intent = targetContext.getPackageManager().getLaunchIntentForPackage(PACKAGE);
    assertNotNull(intent);
    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
    targetContext.startActivity(intent);
    assertTestIdVisible("home-adaptive-section-header", "Home adaptive section");
    screenshot("lifecycle");
  }

  private ViewInteraction assertTestIdVisible(String id, String description) {
    return scrollToTestId(id, description);
  }

  private void assertTestIdAbsent(String id, String description) {
    Throwable lastFailure = null;
    for (int attempt = 0; attempt < WAIT_MS / POLL_MS; attempt += 1) {
      try {
        onView(testIdMatcher(id)).check(doesNotExist());
        return;
      } catch (AssertionError | RuntimeException failure) {
        lastFailure = failure;
        device.waitForIdle(POLL_MS);
      }
    }
    AssertionError failure = new AssertionError("Android testID target remained after dismissal: " + id + " / " + description);
    if (lastFailure != null) failure.initCause(lastFailure);
    throw failure;
  }

  private void clickHomeRoute(String route, String label) {
    clickTestId("home-route-" + route, label);
  }

  private void clickTestId(String id, String description) {
    assertTestIdVisible(id, description).perform(click());
  }

  private void replaceTextTestId(String id, String value) {
    assertTestIdVisible(id, "Text input " + id).perform(click(), replaceText(value), closeSoftKeyboard());
  }

  private void assertTestIdTextContains(String id, String expected, String description) {
    assertTestIdVisible(id, description).check(matches(withText(containsString(expected))));
  }

  private ViewInteraction scrollToTestId(String id, String description) {
    Throwable lastFailure = null;
    int noProgressAttempts = 0;
    for (int attempt = 0; attempt < MAX_SCROLL_ATTEMPTS; attempt += 1) {
      ViewInteraction target;
      try {
        target = onView(testIdMatcher(id));
      } catch (AmbiguousViewMatcherException failure) {
        throw failure;
      } catch (RuntimeException failure) {
        lastFailure = failure;
        device.waitForIdle(POLL_MS);
        continue;
      }
      try {
        target.check(matches(actionableTestIdMatcher(id)));
        return target;
      } catch (AmbiguousViewMatcherException failure) {
        throw failure;
      } catch (AssertionError | RuntimeException failure) {
        lastFailure = failure;
        device.waitForIdle(POLL_MS);
        if (attempt + 1 < MAX_SCROLL_ATTEMPTS) {
          try {
            if (requestTestIdRectangleOnScreen(id)) {
              noProgressAttempts = 0;
            } else {
              noProgressAttempts += 1;
            }
          } catch (AmbiguousViewMatcherException ambiguousSurface) {
            throw ambiguousSurface;
          } catch (AssertionError | RuntimeException scrollFailure) {
            lastFailure = scrollFailure;
            noProgressAttempts += 1;
          }
          if (noProgressAttempts >= MAX_NO_PROGRESS_ATTEMPTS) break;
        }
      }
    }
    AssertionError failure = new AssertionError("Missing Android testID target or action-ready state: " + id + " / " + description);
    if (lastFailure != null) failure.initCause(lastFailure);
    throw failure;
  }

  private Matcher<View> testIdMatcher(String id) {
    return allOf(
        withTagValue(is((Object) id)),
        new TypeSafeMatcher<View>() {
          @Override
          protected boolean matchesSafely(View view) {
            return view.isShown()
                && view.getAlpha() > 0f
                && view.getWidth() > 0
                && view.getHeight() > 0;
          }

          @Override
          public void describeTo(Description description) {
            description.appendText("an active positive-size React Native testID view");
          }
        });
  }

  private Matcher<View> actionableTestIdMatcher(String id) {
    return allOf(testIdMatcher(id), isDisplayed(), isEnabled());
  }

  private boolean requestTestIdRectangleOnScreen(String id) {
    final boolean[] requested = { false };
    onView(testIdMatcher(id)).perform(new ViewAction() {
      @Override
      public Matcher<View> getConstraints() {
        return isAssignableFrom(View.class);
      }

      @Override
      public String getDescription() {
        return "request the exact testID rectangle on screen through its React Native ScrollView";
      }

      @Override
      public void perform(UiController controller, View view) {
        if (!hasReactNativeScrollSurface(view)) {
          throw new IllegalStateException("Android testID target is not owned by a React Native ScrollView.");
        }
        requested[0] = view.requestRectangleOnScreen(new Rect(0, 0, view.getWidth(), view.getHeight()), false);
        controller.loopMainThreadUntilIdle();
      }
    });
    device.waitForIdle(POLL_MS);
    return requested[0];
  }

  private boolean hasReactNativeScrollSurface(View view) {
    if (view instanceof ScrollView) return true;
    ViewParent parent = view.getParent();
    while (parent != null) {
      if (parent instanceof ScrollView) return true;
      parent = parent.getParent();
    }
    return false;
  }

  private void clickAccessibleTarget(String description, String text) {
    UiObject2 object = scrollToAccessibleTarget(description, text);
    assertNotNull("Android id-less accessibility target was not reachable: " + description, object);
    object.click();
  }

  private UiObject2 scrollToAccessibleTarget(String description, String text) {
    Throwable lastFailure = null;
    int noProgressAttempts = 0;
    for (int attempt = 0; attempt < MAX_SCROLL_ATTEMPTS; attempt += 1) {
      UiObject2 object = locateAccessibleTarget(description, text);
      if (object != null && visible(object)) return object;
      if (attempt + 1 == MAX_SCROLL_ATTEMPTS) break;
      try {
        if (scrollAccessibleSurface(description, text)) {
          noProgressAttempts = 0;
        } else {
          noProgressAttempts += 1;
        }
      } catch (AssertionError | RuntimeException failure) {
        lastFailure = failure;
        noProgressAttempts += 1;
      }
      if (noProgressAttempts >= MAX_NO_PROGRESS_ATTEMPTS) break;
    }
    AssertionError failure = new AssertionError("Android id-less accessibility target was not reachable: " + description);
    if (lastFailure != null) failure.initCause(lastFailure);
    throw failure;
  }

  private UiObject2 locateAccessibleTarget(String description, String text) {
    for (BySelector selector : accessibleSelectors(description, text)) {
      List<UiObject2> objects = device.findObjects(selector);
      if (objects.size() > 1) {
        throw new AssertionError("Ambiguous Android id-less accessibility target: " + description);
      }
      if (objects.size() == 1) return objects.get(0);
    }
    return null;
  }

  private boolean scrollAccessibleSurface(String description, String text) {
    UiObject2 surface = locateAccessibleScrollSurface(description, text);
    boolean progressed = surface.scroll(Direction.DOWN, UI_AUTOMATOR_SCROLL_PERCENT);
    device.waitForIdle(POLL_MS);
    return progressed;
  }

  private UiObject2 locateAccessibleScrollSurface(String description, String text) {
    for (BySelector selector : accessibleSelectors(description, text)) {
      UiObject2 match = null;
      for (UiObject2 surface : device.findObjects(By.scrollable(true))) {
        if (!visible(surface)) continue;
        if (surface.findObject(selector) == null) continue;
        if (match != null) {
          throw new AssertionError("Ambiguous Android scroll surface for id-less target: " + description);
        }
        match = surface;
      }
      if (match != null) return match;
    }
    throw new AssertionError("Android React Native scroll surface was not found for: " + description);
  }

  private List<BySelector> accessibleSelectors(String description, String text) {
    List<BySelector> selectors = new ArrayList<>();
    if (description != null) selectors.add(By.descContains(description));
    if (text != null) selectors.add(By.textContains(text));
    return selectors;
  }

  private boolean visible(UiObject2 object) {
    Rect bounds = object.getVisibleBounds();
    Rect display = new Rect(0, 0, device.getDisplayWidth(), device.getDisplayHeight());
    return object.isEnabled() && bounds.width() > 0 && bounds.height() > 0 && Rect.intersects(bounds, display);
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
