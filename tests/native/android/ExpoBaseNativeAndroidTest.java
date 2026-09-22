package com.expobase.reference;

import static androidx.test.platform.app.InstrumentationRegistry.getInstrumentation;
import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.action.ViewActions.click;
import static androidx.test.espresso.action.ViewActions.closeSoftKeyboard;
import static androidx.test.espresso.action.ViewActions.replaceText;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static org.hamcrest.Matchers.allOf;
import static androidx.test.espresso.matcher.ViewMatchers.hasFocus;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayingAtLeast;
import static androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom;
import static androidx.test.espresso.matcher.ViewMatchers.isEnabled;
import static androidx.test.espresso.matcher.ViewMatchers.withContentDescription;
import static androidx.test.espresso.matcher.ViewMatchers.withTagValue;
import static androidx.test.espresso.matcher.ViewMatchers.withText;
import static org.hamcrest.Matchers.anyOf;
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
import androidx.test.espresso.NoMatchingViewException;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.espresso.UiController;
import androidx.test.espresso.ViewAction;
import androidx.test.espresso.ViewInteraction;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.hamcrest.Description;
import org.hamcrest.Matcher;
import org.hamcrest.TypeSafeMatcher;

import java.util.ArrayList;
import java.util.List;
import java.io.File;
@RunWith(AndroidJUnit4.class)
public final class ExpoBaseNativeAndroidTest {
  private static final String PACKAGE = "com.expobase.reference";
  private static final long WAIT_MS = 20_000L;
  private static final long POLL_MS = 500L;
  private static final int MAX_SCROLL_ATTEMPTS = (int) (WAIT_MS / POLL_MS);
  private static final int MAX_NO_PROGRESS_ATTEMPTS = 3;

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
    assertModalAccessibilityVisible("card-action-menu", "Card actions", null, "Card action menu");
    clickModalAccessibilityTarget("Edit card", null, "Edit card");
    assertModalAccessibilityAbsent("card-action-menu", "Card actions", null, "Card action menu");
    assertTestIdVisible("overlay-action-menu-trigger", "Open action menu");
    clickTestId("overlay-dialog-trigger", "Open dialog");
    assertModalAccessibilityVisible("overlay-dialog-review-action", "Review", "Review", "Dialog review action");
    device.pressBack();
    assertModalAccessibilityAbsent("overlay-dialog-review-action", "Review", "Review", "Dialog review action");
    assertTestIdVisible("overlay-dialog-trigger", "Open dialog");
    clickTestId("overlay-bottom-sheet-trigger", "Open bottom sheet");
    assertModalAccessibilityVisible("bottom-sheet-panel", "Quick actions", "Quick actions", "Bottom sheet panel");
    device.pressBack();
    assertModalAccessibilityAbsent("bottom-sheet-panel", "Quick actions", "Quick actions", "Bottom sheet panel");
    assertTestIdVisible("overlay-bottom-sheet-trigger", "Open bottom sheet");
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

  private UiObject2 assertModalAccessibilityVisible(String productTestId, String contentDescription, String text, String description) {
    return requireUniqueModalAccessibilityTarget(contentDescription, text, productTestId + " / " + description);
  }

  private void assertModalAccessibilityAbsent(String productTestId, String contentDescription, String text, String description) {
    Throwable lastFailure = null;
    for (int attempt = 0; attempt < WAIT_MS / POLL_MS; attempt += 1) {
      try {
        List<UiObject2> matches = findVisibleEnabledModalAccessibilityTargets(contentDescription, text);
        if (matches.size() > 1) {
          throw new AssertionError("Ambiguous Android modal accessibility target after dismissal: " + productTestId + " / " + description);
        }
        if (matches.isEmpty()) return;
      } catch (AssertionError failure) {
        throw failure;
      } catch (RuntimeException failure) {
        lastFailure = failure;
      }
      device.waitForIdle(POLL_MS);
    }
    AssertionError failure = new AssertionError("Android modal accessibility target remained after dismissal: " + productTestId + " / " + description);
    if (lastFailure != null) failure.initCause(lastFailure);
    throw failure;
  }

  private void clickHomeRoute(String route, String label) {
    clickTestId("home-route-" + route, label);
  }

  private void clickTestId(String id, String description) {
    scrollToTestId(id, description, clickReadyTestIdMatcher(id)).perform(click());
  }

  private void replaceTextTestId(String id, String value) {
    scrollToTestId(id, "Text input " + id, clickReadyTestIdMatcher(id)).perform(click(), replaceText(value), closeSoftKeyboard());
  }

  private void assertTestIdTextContains(String id, String expected, String description) {
    assertTestIdVisible(id, description).check(matches(withText(containsString(expected))));
  }

  private ViewInteraction scrollToTestId(String id, String description) {
    return scrollToTestId(id, description, visibleTestIdMatcher(id));
  }

  private ViewInteraction scrollToTestId(String id, String description, Matcher<View> readinessMatcher) {
    Throwable lastFailure = null;
    int noProgressAttempts = 0;
    for (int attempt = 0; attempt < MAX_SCROLL_ATTEMPTS; attempt += 1) {
      ViewInteraction target;
      try {
        target = onViewInActivityRoot(testIdMatcher(id));
      } catch (AmbiguousViewMatcherException failure) {
        throw failure;
      } catch (RuntimeException failure) {
        lastFailure = failure;
        device.waitForIdle(POLL_MS);
        continue;
      }
      try {
        target.check(matches(testIdMatcher(id)));
      } catch (AmbiguousViewMatcherException failure) {
        throw failure;
      } catch (NoMatchingViewException | AssertionError failure) {
        lastFailure = failure;
        device.waitForIdle(POLL_MS);
        continue;
      }
      try {
        target.check(matches(readinessMatcher));
        return target;
      } catch (AmbiguousViewMatcherException failure) {
        throw failure;
      } catch (NoMatchingViewException failure) {
        lastFailure = failure;
        device.waitForIdle(POLL_MS);
        continue;
      } catch (AssertionError | RuntimeException failure) {
        lastFailure = failure;
        if (attempt + 1 < MAX_SCROLL_ATTEMPTS) {
          try {
            if (requestTestIdRectangleOnScreen(id)) {
              noProgressAttempts = 0;
            } else {
              noProgressAttempts += 1;
            }
          } catch (NoMatchingViewException absent) {
            lastFailure = absent;
            device.waitForIdle(POLL_MS);
            continue;
          } catch (AmbiguousViewMatcherException ambiguousSurface) {
            throw ambiguousSurface;
          } catch (AssertionError | RuntimeException scrollFailure) {
            lastFailure = scrollFailure;
            noProgressAttempts += 1;
          }
          device.waitForIdle(POLL_MS);
          if (noProgressAttempts >= MAX_NO_PROGRESS_ATTEMPTS) break;
        }
      }
    }
    AssertionError failure = new AssertionError("Missing Android testID target or requested readiness state: " + id + " / " + description);
    if (lastFailure != null) failure.initCause(lastFailure);
    throw failure;
  }

  private ViewInteraction onViewInActivityRoot(Matcher<View> targetMatcher) {
    return onView(targetMatcher);
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

  private Matcher<View> visibleTestIdMatcher(String id) {
    return allOf(testIdMatcher(id), isDisplayed());
  }

  private Matcher<View> clickReadyTestIdMatcher(String id) {
    return allOf(testIdMatcher(id), isDisplayingAtLeast(90), isEnabled());
  }

  private boolean requestTestIdRectangleOnScreen(String id) {
    return requestRectangleOnScreen(testIdMatcher(id), "testID target " + id);
  }

  private boolean requestAccessibleRectangleOnScreen(String description, String text) {
    return requestRectangleOnScreen(accessibleTargetMatcher(description, text), "id-less accessibility target " + description);
  }

  private boolean requestRectangleOnScreen(Matcher<View> targetMatcher, String description) {
    final boolean[] requested = { false };
    onViewInActivityRoot(targetMatcher).perform(new ViewAction() {
      @Override
      public Matcher<View> getConstraints() {
        return isAssignableFrom(View.class);
      }

      @Override
      public String getDescription() {
        return "request the exact " + description + " rectangle on screen through its React Native ScrollView";
      }

      @Override
      public void perform(UiController controller, View view) {
        if (!hasReactNativeScrollSurface(view)) {
          throw new IllegalStateException("Android target is not owned by a React Native ScrollView.");
        }
        requested[0] = view.requestRectangleOnScreen(new Rect(0, 0, view.getWidth(), view.getHeight()), false);
        controller.loopMainThreadUntilIdle();
      }
    });
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
    scrollToAccessibleTarget(description, text).perform(click());
  }

  private ViewInteraction scrollToAccessibleTarget(String description, String text) {
    Throwable lastFailure = null;
    int noProgressAttempts = 0;
    Matcher<View> targetMatcher = accessibleTargetMatcher(description, text);
    for (int attempt = 0; attempt < MAX_SCROLL_ATTEMPTS; attempt += 1) {
      ViewInteraction target;
      try {
        target = onViewInActivityRoot(targetMatcher);
      } catch (AmbiguousViewMatcherException failure) {
        throw failure;
      } catch (RuntimeException failure) {
        lastFailure = failure;
        device.waitForIdle(POLL_MS);
        continue;
      }
      try {
        target.check(matches(targetMatcher));
      } catch (AmbiguousViewMatcherException failure) {
        throw failure;
      } catch (NoMatchingViewException | AssertionError failure) {
        lastFailure = failure;
        device.waitForIdle(POLL_MS);
        continue;
      }
      try {
        target.check(matches(clickReadyAccessibleTargetMatcher(description, text)));
        return target;
      } catch (AmbiguousViewMatcherException failure) {
        throw failure;
      } catch (NoMatchingViewException failure) {
        lastFailure = failure;
        device.waitForIdle(POLL_MS);
        continue;
      } catch (AssertionError | RuntimeException failure) {
        lastFailure = failure;
        if (attempt + 1 < MAX_SCROLL_ATTEMPTS) {
          try {
            if (requestAccessibleRectangleOnScreen(description, text)) {
              noProgressAttempts = 0;
            } else {
              noProgressAttempts += 1;
            }
          } catch (NoMatchingViewException absent) {
            lastFailure = absent;
            device.waitForIdle(POLL_MS);
            continue;
          } catch (AmbiguousViewMatcherException ambiguousTarget) {
            throw ambiguousTarget;
          } catch (AssertionError | RuntimeException scrollFailure) {
            lastFailure = scrollFailure;
            noProgressAttempts += 1;
          }
          device.waitForIdle(POLL_MS);
          if (noProgressAttempts >= MAX_NO_PROGRESS_ATTEMPTS) break;
        }
      }
    }
    AssertionError failure = new AssertionError("Android id-less accessibility target was not action-ready: " + description);
    if (lastFailure != null) failure.initCause(lastFailure);
    throw failure;
  }

  private UiObject2 requireUniqueModalAccessibilityTarget(String contentDescription, String text, String description) {
    Throwable lastFailure = null;
    for (int attempt = 0; attempt < WAIT_MS / POLL_MS; attempt += 1) {
      try {
        List<UiObject2> matches = findVisibleEnabledModalAccessibilityTargets(contentDescription, text);
        if (matches.size() > 1) {
          throw new AssertionError("Ambiguous Android modal accessibility target: " + description);
        }
        if (matches.size() == 1) return matches.get(0);
      } catch (AssertionError failure) {
        throw failure;
      } catch (RuntimeException failure) {
        lastFailure = failure;
      }
      device.waitForIdle(POLL_MS);
    }
    AssertionError failure = new AssertionError("Missing Android modal accessibility target: " + description);
    if (lastFailure != null) failure.initCause(lastFailure);
    throw failure;
  }

  private List<UiObject2> findVisibleEnabledModalAccessibilityTargets(String contentDescription, String text) {
    if (contentDescription == null && text == null) {
      throw new IllegalArgumentException("A modal accessibility target requires content description or text.");
    }
    // UiDevice.findObjects searches the currently active accessibility window.
    List<UiObject2> candidates = contentDescription == null
        ? new ArrayList<>()
        : device.findObjects(By.descContains(contentDescription));
    List<UiObject2> active = visibleEnabledModalAccessibilityTargets(candidates);
    if (active.isEmpty() && text != null) return visibleEnabledModalAccessibilityTargets(device.findObjects(By.textContains(text)));
    return active;
  }

  private List<UiObject2> visibleEnabledModalAccessibilityTargets(List<UiObject2> candidates) {
    List<UiObject2> active = new ArrayList<>();
    for (UiObject2 candidate : candidates) {
      Rect visibleBounds = candidate.getVisibleBounds();
      if (visibleBounds.width() > 0 && visibleBounds.height() > 0 && candidate.isEnabled()) active.add(candidate);
    }
    return active;
  }

  private void clickModalAccessibilityTarget(String contentDescription, String text, String description) {
    requireUniqueModalAccessibilityTarget(contentDescription, text, description).click();
  }

  private Matcher<View> accessibleTargetMatcher(String description, String text) {
    if (description != null && text != null) {
      return anyOf(withContentDescription(containsString(description)), withText(containsString(text)));
    }
    if (description != null) return withContentDescription(containsString(description));
    if (text != null) return withText(containsString(text));
    throw new IllegalArgumentException("An id-less accessibility target requires content description or text.");
  }

  private Matcher<View> clickReadyAccessibleTargetMatcher(String description, String text) {
    return allOf(accessibleTargetMatcher(description, text), isDisplayingAtLeast(90), isEnabled());
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
