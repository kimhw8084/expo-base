import XCTest

final class AppRobot {
    let app: XCUIApplication

    init(app: XCUIApplication) {
        self.app = app
    }

    @discardableResult
    func waitForHome(timeout: TimeInterval = 30) -> XCUIElement {
        let landmark = app.staticTexts["Universal application foundation"]
        XCTAssertTrue(landmark.waitForExistence(timeout: timeout), "The home landmark did not render.")
        return landmark
    }

    func screenshot(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        XCTContext.runActivity(named: "Screenshot: \(name)") { activity in
            activity.add(attachment)
        }
    }

    @discardableResult
    func scrollUntilVisible(_ element: XCUIElement, maxSwipes: Int = 10) -> Bool {
        for _ in 0..<maxSwipes {
            if element.exists && element.isHittable { return true }
            let scrollView = app.scrollViews.firstMatch
            guard scrollView.exists else { return element.exists && element.isHittable }
            scrollView.swipeUp()
        }
        return element.exists && element.isHittable
    }

    func text(_ value: String) -> XCUIElement {
        app.staticTexts[value]
    }

    func tapButton(_ label: String, timeout: TimeInterval = 10) {
        let button = app.buttons[label]
        XCTAssertTrue(button.waitForExistence(timeout: timeout), "Button \(label) was not found.")
        XCTAssertTrue(button.isHittable, "Button \(label) is not hittable.")
        button.tap()
    }

    func tapHomeRoute(_ route: String, timeout: TimeInterval = 20) {
        let routeButton = app.buttons["home-route-\(route)"]
        XCTAssertTrue(routeButton.waitForExistence(timeout: timeout), "Home route \(route) was not found.")
        XCTAssertTrue(scrollUntilVisible(routeButton), "Home route \(route) was not reachable by scrolling.")
        routeButton.tap()
    }
}

final class NavigationRobot {
    private let app: XCUIApplication

    init(app: XCUIApplication) {
        self.app = app
    }

    @discardableResult
    func destination(_ key: String) -> XCUIElement {
        let item = app.otherElements["navigation-item-\(key)"]
        XCTAssertTrue(item.waitForExistence(timeout: 10), "Navigation destination \(key) was not found.")
        XCTAssertTrue(item.isHittable, "Navigation destination \(key) is not hittable.")
        XCTAssertGreaterThanOrEqual(item.frame.width, 44)
        XCTAssertGreaterThanOrEqual(item.frame.height, 44)
        return item
    }

    func tap(_ key: String, expectedLandmark: String) {
        destination(key).tap()
        let landmark = app.staticTexts[expectedLandmark]
        XCTAssertTrue(landmark.waitForExistence(timeout: 20), "Destination \(key) did not render landmark \(expectedLandmark).")
    }
}

final class FormRobot {
    private let app: XCUIApplication

    init(app: XCUIApplication) {
        self.app = app
    }

    func textField(_ id: String) -> XCUIElement {
        let field = app.descendants(matching: .any)[id]
        XCTAssertTrue(field.waitForExistence(timeout: 10), "Form field \(id) was not found.")
        XCTAssertTrue(AppRobot(app: app).scrollUntilVisible(field), "Form field \(id) is not reachable.")
        return field
    }

    func type(_ value: String, into id: String) {
        let field = textField(id)
        field.tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5), "The native keyboard did not appear for field \(id).")
        var expectedValue = ""
        for character in value {
            expectedValue.append(character)
            field.typeText(String(character))
            let valueExpectation = XCTNSPredicateExpectation(
                predicate: NSPredicate(format: "value == %@", expectedValue),
                object: field
            )
            XCTAssertEqual(XCTWaiter.wait(for: [valueExpectation], timeout: 2), .completed, "Field \(id) did not retain typed character \(character).")
        }
    }
}

final class OverlayRobot {
    private let app: XCUIApplication

    init(app: XCUIApplication) {
        self.app = app
    }

    func visibleElement(label: String, timeout: TimeInterval = 10) -> XCUIElement {
        let element = app.staticTexts[label]
        XCTAssertTrue(element.waitForExistence(timeout: timeout), "Overlay content \(label) was not found.")
        return element
    }

    func dismissWithButton(_ label: String) {
        let button = app.descendants(matching: .any)[label]
        XCTAssertTrue(button.waitForExistence(timeout: 10), "Overlay action \(label) was not found.")
        XCTAssertTrue(button.isHittable, "Overlay action \(label) is not hittable.")
        button.tap()
    }
}
