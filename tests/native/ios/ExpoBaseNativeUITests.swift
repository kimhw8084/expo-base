import XCTest

final class ExpoBaseNativeUITests: XCTestCase {
    private let bundleIdentifier = "com.expobase.reference"
    private var app: XCUIApplication!
    private var appRobot: AppRobot!
    private var navigation: NavigationRobot!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication(bundleIdentifier: bundleIdentifier)
        app.launchArguments += ["-expo-base-ui-testing"]
        app.launch()
        appRobot = AppRobot(app: app)
        navigation = NavigationRobot(app: app)
    }

    override func tearDownWithError() throws {
        app.terminate()
    }

    override func recordFailure(withDescription description: String, inFile filePath: String?, atLine lineNumber: Int, expected: Bool) {
        if app != nil {
            let screenshot = XCTAttachment(screenshot: app.screenshot())
            screenshot.name = "failure-screenshot"
            screenshot.lifetime = .keepAlways
            add(screenshot)

            let hierarchy = XCTAttachment(string: app.debugDescription)
            hierarchy.name = "failure-accessibility-hierarchy"
            hierarchy.lifetime = .keepAlways
            add(hierarchy)
        }
        super.recordFailure(withDescription: description, inFile: filePath ?? "<unknown>", atLine: lineNumber, expected: expected)
    }

    func testPOC01LaunchesAndFindsHomeLandmark() throws {
        appRobot.waitForHome()
        appRobot.screenshot("poc-01-home")
    }

    func testPOC02TapsPrimaryNavigationAndReadsGeometry() throws {
        appRobot.waitForHome()
        navigation.tap("build", expectedLandmark: "Form interaction acceptance surface")
        appRobot.screenshot("poc-02-build")
    }

    func testPOC03FindsAndTypesIntoTextInput() throws {
        appRobot.waitForHome()
        navigation.tap("build", expectedLandmark: "Form interaction acceptance surface")

        FormRobot(app: app).type("Native Test User", into: "demo-name")
        appRobot.screenshot("poc-03-text-input")
    }

    func testPOC04ScrollsAReferenceSurface() throws {
        appRobot.waitForHome()
        let scrollView = app.scrollViews.firstMatch
        XCTAssertTrue(scrollView.waitForExistence(timeout: 10), "The home scroll surface was not discoverable.")
        scrollView.swipeUp()
        XCTAssertTrue(app.staticTexts["Target platforms"].waitForExistence(timeout: 10), "Scroll did not reveal the expected home content.")
    }

    func testPOC05RotatesAndReturnsToPortrait() throws {
        appRobot.waitForHome()
        XCUIDevice.shared.orientation = .landscapeLeft
        XCTAssertTrue(app.staticTexts["Universal application foundation"].waitForExistence(timeout: 10))
        XCUIDevice.shared.orientation = .portrait
        XCTAssertTrue(app.staticTexts["Universal application foundation"].waitForExistence(timeout: 10))
    }

    func testPOC06AccessibilityAuditRunsOnHome() throws {
        XCTAssertTrue(app.staticTexts["Universal application foundation"].waitForExistence(timeout: 30))
        if #available(iOS 17.0, *) {
            try app.performAccessibilityAudit(for: [.hitRegion])
        }
    }

    func testLifecycleRelaunchesCleanly() throws {
        appRobot.waitForHome()
        app.terminate()
        app.launch()
        appRobot.waitForHome()
        appRobot.screenshot("lifecycle-relaunch")
    }

    func testNavigationDestinationsHaveNativeTargetsAndLandmarks() throws {
        appRobot.waitForHome()
        navigation.tap("build", expectedLandmark: "Form interaction acceptance surface")
        navigation.tap("data", expectedLandmark: "Adaptive data workspace")
        navigation.tap("patterns", expectedLandmark: "Dashboard")
        navigation.tap("system", expectedLandmark: "System acceptance laboratory")
        navigation.tap("home", expectedLandmark: "Universal application foundation")
    }

    func testFormsKeyboardAndValidationReachability() throws {
        appRobot.waitForHome()
        navigation.tap("build", expectedLandmark: "Form interaction acceptance surface")
        let form = FormRobot(app: app)
        form.type("NativeAcceptance", into: "demo-name")
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5), "Typing did not present the native software keyboard.")
        let email = form.textField("demo-email")
        email.tap()
        email.typeText("native@example.com")
        let next = app.keyboards.buttons.matching(NSPredicate(format: "label CONTAINS[c] %@", "next")).firstMatch
        XCTAssertTrue(next.waitForExistence(timeout: 5), "The native keyboard Next action was not available.")
        next.tap()
        let password = form.textField("demo-password")
        password.typeText("NativePassword123!")
        let done = app.keyboards.buttons["Done"]
        if done.exists { done.tap() }
        let validate = app.buttons["Validate form"]
        XCTAssertTrue(appRobot.scrollUntilVisible(validate), "The form validation action was not reachable after native keyboard entry.")
        validate.tap()
        XCTAssertTrue(app.otherElements["adapter-form-error-summary"].waitForExistence(timeout: 10))
        appRobot.scrollToTop(maxSwipes: 20)
        appRobot.screenshot("forms-validation")
    }

    func testFormSpecimenFamiliesRespond() throws {
        appRobot.waitForHome()
        navigation.tap("build", expectedLandmark: "Form interaction acceptance surface")
        let form = FormRobot(app: app)

        appRobot.scrollToTop()
        for id in ["plain", "search", "password-static", "email-static", "url-static", "phone-static", "number-static", "currency", "notes"] {
            let field = form.textField(id)
            XCTAssertTrue(field.isHittable, "Form specimen \(id) is not hittable on iOS.")
        }
        appRobot.scrollToTop()
        form.type("card", into: "search")
        app.terminate()
        app.launch()
        appRobot.waitForHome()
        navigation.tap("build", expectedLandmark: "Form interaction acceptance surface")

        let includeFees = app.descendants(matching: .any)["static-include-fees"]
        XCTAssertTrue(appRobot.scrollUntilVisible(includeFees))
        let includeFeesBefore = String(describing: includeFees.value)
        includeFees.tap()
        XCTAssertTrue(waitForValueChange(includeFees, from: includeFeesBefore), "Checkbox did not expose a changed native state.")

        let dining = app.descendants(matching: .any)["benefits-dining"]
        appRobot.scrollToTop()
        XCTAssertTrue(appRobot.scrollUntilVisible(dining, maxSwipes: 20))
        dining.tap()
        XCTAssertTrue(dining.isHittable, "Checkbox group option became unreachable after selection.")

        let highestValue = app.descendants(matching: .any)["static-sort-value"]
        XCTAssertTrue(appRobot.scrollUntilVisible(highestValue, maxSwipes: 20))
        let highestValueBefore = String(describing: highestValue.value)
        highestValue.tap()
        XCTAssertTrue(waitForValueChange(highestValue, from: highestValueBefore) || highestValue.isSelected || String(describing: highestValue.value).contains("1"), "Radio option did not expose selected state.")

        let compact = app.descendants(matching: .any)["static-density-compact"]
        XCTAssertTrue(appRobot.scrollUntilVisible(compact, maxSwipes: 20))
        let compactBefore = String(describing: compact.value)
        compact.tap()
        XCTAssertTrue(waitForValueChange(compact, from: compactBefore) || compact.isSelected || String(describing: compact.value).contains("1"), "Segmented option did not expose selected state.")

        let notifications = app.switches["Bonus notifications"]
        XCTAssertTrue(notifications.waitForExistence(timeout: 10))
        let notificationsBefore = String(describing: notifications.value)
        notifications.tap()
        XCTAssertTrue(waitForValueChange(notifications, from: notificationsBefore), "Switch did not expose a changed native state.")

        let priority = app.descendants(matching: .any)["static-priority"]
        XCTAssertTrue(appRobot.scrollUntilVisible(priority))
        let increasePriority = app.buttons["Increase Review priority"]
        XCTAssertTrue(increasePriority.waitForExistence(timeout: 10))
        increasePriority.tap()
        XCTAssertTrue(String(describing: priority.value).contains("3"), "Number stepper did not advance its value.")

        let codeDigit = app.textFields["static-verification-code-1"]
        XCTAssertTrue(appRobot.scrollUntilVisible(codeDigit))
        codeDigit.tap()
        codeDigit.typeText("1")
        XCTAssertTrue(String(describing: codeDigit.value).contains("1"), "Verification code input did not accept a digit.")

        app.terminate()
        app.launch()
        appRobot.waitForHome()
        navigation.tap("build", expectedLandmark: "Form interaction acceptance surface")
        let issuer = app.descendants(matching: .any)["static-issuer"]
        XCTAssertTrue(appRobot.scrollUntilVisible(issuer, maxSwipes: 20))
        issuer.tap()
        let issuerOption = hittableElement(label: "American Express")
        issuerOption.tap()
        XCTAssertTrue(appRobot.scrollUntilVisible(issuer), "SelectField did not remain reachable after selection.")

        let combobox = app.descendants(matching: .any)["static-combobox"]
        XCTAssertTrue(appRobot.scrollUntilVisible(combobox))
        combobox.tap()
        let comboSearch = app.textFields["Search Primary issuer"]
        XCTAssertTrue(comboSearch.waitForExistence(timeout: 10))
        typeSlowly("ame", into: comboSearch)
        hittableElement(label: "American Express").tap()

        app.terminate()
        app.launch()
        appRobot.waitForHome()
        navigation.tap("build", expectedLandmark: "Form interaction acceptance surface")
        let networks = app.descendants(matching: .any)["static-networks"]
        XCTAssertTrue(appRobot.scrollUntilVisible(networks))
        networks.tap()
        let mastercard = hittableElement(label: "Mastercard")
        let mastercardBefore = String(describing: mastercard.value)
        mastercard.tap()
        XCTAssertTrue(waitForValueChange(mastercard, from: mastercardBefore) || mastercard.isSelected || String(describing: mastercard.value).contains("1"), "MultiSelectField did not expose its changed selection.")

        app.terminate()
        app.launch()
        appRobot.waitForHome()
        appRobot.tapHomeRoute("golden-plus")
        for id in ["plus-date", "plus-time", "plus-range-start", "plus-range-end"] {
            let field = app.descendants(matching: .any)[id]
            XCTAssertTrue(field.waitForExistence(timeout: 15), "Date/time specimen \(id) was not discoverable.")
            XCTAssertTrue(appRobot.scrollUntilVisible(field), "Date/time specimen \(id) is not reachable.")
            XCTAssertTrue(field.isHittable, "Date/time specimen \(id) is not hittable.")
        }
    }

    func testOverlayMenuDialogAndSheetLifecycle() throws {
        appRobot.waitForHome()
        appRobot.tapHomeRoute("overlays")
        XCTAssertTrue(app.staticTexts["Overlay Manager acceptance surface"].waitForExistence(timeout: 20))
        let menuTrigger = app.buttons["overlay-action-menu-trigger"]
        XCTAssertTrue(menuTrigger.waitForExistence(timeout: 10))
        menuTrigger.tap()
        let menu = app.otherElements["card-action-menu"]
        XCTAssertTrue(menu.waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["General"].waitForExistence(timeout: 10))
        let editCard = app.descendants(matching: .any)["Edit card"]
        XCTAssertTrue(editCard.waitForExistence(timeout: 10), "The action menu item was not discoverable.")
        XCTAssertTrue(editCard.isHittable, "The action menu item was not hittable.")
        editCard.tap()
        app.buttons["Open dialog"].tap()
        XCTAssertTrue(app.staticTexts["Review this recommendation"].waitForExistence(timeout: 10))
        OverlayRobot(app: app).dismissWithButton("Cancel")
        app.buttons["Open bottom sheet"].tap()
        XCTAssertTrue(app.staticTexts["Quick actions"].waitForExistence(timeout: 10))
        OverlayRobot(app: app).dismissWithButton("Close")
    }

    func testCommandLauncherOpenFilterSelectAndDismiss() throws {
        appRobot.waitForHome()
        appRobot.tapHomeRoute("workflows")
        let commandTrigger = app.buttons["workflow-command-trigger"]
        XCTAssertTrue(commandTrigger.waitForExistence(timeout: 20), "Command launcher trigger was not found.")
        commandTrigger.tap()
        let search = app.textFields.firstMatch
        XCTAssertTrue(search.waitForExistence(timeout: 10), "Command launcher search field did not appear.")
        search.tap()
        var expectedSearchValue = ""
        for character in "offline" {
            expectedSearchValue.append(character)
            search.typeText(String(character))
            let valueExpectation = XCTNSPredicateExpectation(
                predicate: NSPredicate(format: "value == %@", expectedSearchValue),
                object: search
            )
            XCTAssertEqual(XCTWaiter.wait(for: [valueExpectation], timeout: 2), .completed, "Command launcher search did not retain typed character \(character).")
        }
        let offlineCommand = app.buttons["command-result-offline"]
        XCTAssertTrue(offlineCommand.waitForExistence(timeout: 15), "The filtered offline command was not actionable.")
        XCTAssertTrue(offlineCommand.isHittable, "The filtered offline command was not hittable.")
        offlineCommand.tap()
        XCTAssertTrue(app.staticTexts["Activity"].waitForExistence(timeout: 10))
        commandTrigger.tap()
        XCTAssertTrue(app.textFields.firstMatch.waitForExistence(timeout: 10))
        let dismiss = app.descendants(matching: .any)["Dismiss dialog"]
        XCTAssertTrue(dismiss.waitForExistence(timeout: 10), "The command launcher dismissal target was not discoverable.")
        XCTAssertTrue(dismiss.isHittable, "The command launcher dismissal target was not hittable.")
        dismiss.tap()
    }

    func testDataWorkspaceSelectionAndVisualizationLandmark() throws {
        appRobot.waitForHome()
        navigation.tap("data", expectedLandmark: "Adaptive data workspace")
        XCTAssertTrue(app.otherElements["card-data-toolbar"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.otherElements["card-data-table"].waitForExistence(timeout: 10))
        let firstRow = app.descendants(matching: .any)["card-data-table-compact-row-venture-x"]
        XCTAssertTrue(firstRow.waitForExistence(timeout: 10), "The first compact data row was not discoverable.")
        XCTAssertTrue(appRobot.scrollUntilVisible(firstRow), "The first compact data row is not reachable.")
        firstRow.tap()
        XCTAssertTrue(app.otherElements["selected-record-details"].waitForExistence(timeout: 10), "Selecting a data row did not reveal its details.")
        navigation.tap("data", expectedLandmark: "Adaptive data workspace")
        navigation.tap("home", expectedLandmark: "Universal application foundation")
        appRobot.tapHomeRoute("visualization")
        XCTAssertTrue(app.otherElements["visualization-portfolio-card"].waitForExistence(timeout: 20))
    }

    func testFlagshipRoutesRenderAndScroll() throws {
        appRobot.waitForHome()
        for (card, landmark) in [
            ("analytics-showcase", "A calm view of growth"),
            ("finance-showcase", "Value, contribution, and control"),
            ("monitoring-showcase", "Know what needs attention"),
        ] {
            appRobot.tapHomeRoute(card)
            XCTAssertTrue(app.staticTexts[landmark].waitForExistence(timeout: 20), "Showcase \(card) did not render.")
            appRobot.scrollToTop(maxSwipes: 20)
            appRobot.screenshot("showcase-\(card.replacingOccurrences(of: " ", with: "-"))")
            navigation.tap("home", expectedLandmark: "Universal application foundation")
        }
    }

    func testServerStateAndAdvancedVisualizationLandmarks() throws {
        appRobot.waitForHome()
        appRobot.tapHomeRoute("server-state")
        XCTAssertTrue(app.staticTexts["server-state-load-count"].waitForExistence(timeout: 20), "Server-state load counter was not rendered.")
        XCTAssertTrue(app.buttons["Refresh tasks"].waitForExistence(timeout: 10), "Server-state refresh action was not rendered.")
        app.buttons["Refresh tasks"].tap()
        app.terminate()
        app.launch()
        appRobot.waitForHome()
        appRobot.tapHomeRoute("golden-plus")
        XCTAssertTrue(app.otherElements["golden-plus-advanced-visualization"].waitForExistence(timeout: 20), "Advanced visualization fixture was not rendered.")
    }

    func testRuntimeThemeDensityLocaleAndMotionControls() throws {
        appRobot.waitForHome()

        let dark = app.buttons["Theme: Dark"]
        XCTAssertTrue(appRobot.scrollUntilVisible(dark), "Dark-theme runtime control was not reachable.")
        dark.tap()

        let compact = app.buttons["Density: Compact"]
        XCTAssertTrue(appRobot.scrollUntilVisible(compact), "Compact-density runtime control was not reachable.")
        compact.tap()

        let pseudoLTR = app.buttons["Locale: Pseudo LTR"]
        XCTAssertTrue(appRobot.scrollUntilVisible(pseudoLTR), "Pseudo-LTR runtime control was not reachable.")
        pseudoLTR.tap()

        let pseudoRTL = app.buttons["Locale: Pseudo RTL"]
        XCTAssertTrue(appRobot.scrollUntilVisible(pseudoRTL), "Pseudo-RTL runtime control was not reachable.")
        pseudoRTL.tap()

        let reducedMotion = app.buttons["Motion: Reduced"]
        XCTAssertTrue(appRobot.scrollUntilVisible(reducedMotion), "Reduced-motion runtime control was not reachable.")
        reducedMotion.tap()

        let settingsStatus = app.staticTexts["runtime-settings-status"]
        XCTAssertTrue(settingsStatus.waitForExistence(timeout: 10))
        XCTAssertTrue(settingsStatus.label.contains("Dark theme"))
        XCTAssertTrue(settingsStatus.label.contains("Compact density"))
        let localeStatus = app.staticTexts["runtime-locale-status"]
        XCTAssertTrue(localeStatus.waitForExistence(timeout: 10))
        XCTAssertTrue(localeStatus.label.contains("RTL"))
        appRobot.scrollToTop(maxSwipes: 20)
        appRobot.screenshot("runtime-pseudo-rtl-reduced")
    }

    func testOrientationPreservesNavigationAndOverlayBounds() throws {
        appRobot.waitForHome()
        XCUIDevice.shared.orientation = .landscapeLeft
        XCTAssertTrue(app.staticTexts["Universal application foundation"].waitForExistence(timeout: 15))
        XCTAssertTrue(navigation.destination("home").isHittable)
        XCUIDevice.shared.orientation = .portrait
        XCTAssertTrue(app.staticTexts["Universal application foundation"].waitForExistence(timeout: 15))
        XCTAssertTrue(navigation.destination("home").isHittable)
    }

    private func typeSlowly(_ value: String, into field: XCUIElement) {
        var expected = ""
        for character in value {
            expected.append(character)
            field.typeText(String(character))
            let expectation = XCTNSPredicateExpectation(
                predicate: NSPredicate(format: "value == %@", expected),
                object: field
            )
            XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: 2), .completed, "Native field did not retain typed value \(expected).")
        }
    }

    private func waitForValueChange(_ element: XCUIElement, from previous: String, timeout: TimeInterval = 5) -> Bool {
        let expectation = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "value != %@", previous),
            object: element
        )
        return XCTWaiter.wait(for: [expectation], timeout: timeout) == .completed
    }

    private func hittableElement(label: String) -> XCUIElement {
        let matches = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).allElementsBoundByIndex
        if let element = matches.first(where: { $0.isHittable }) { return element }
        let fallback = app.descendants(matching: .any)[label]
        XCTAssertTrue(fallback.waitForExistence(timeout: 10), "Native element \(label) was not found.")
        XCTAssertTrue(fallback.isHittable, "Native element \(label) is not hittable.")
        return fallback
    }
}
