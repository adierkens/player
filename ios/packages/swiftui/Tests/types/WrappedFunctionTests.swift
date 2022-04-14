//
//  WrappedFunctionTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/5/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore

@testable import PlayerUI
class WrappedFunctionTests: XCTestCase {
    let context: JSContext = JSContext()

    func testWrappedFunction() {
        let called = expectation(description: "Function Called")
        let callback: @convention(block) () -> Void = { called.fulfill() }

        let function = JSValue(object: callback, in: context)
        let wrapper = WrappedFunction<Void>(rawValue: function)

        wrapper.callAsFunction()

        wait(for: [called], timeout: 1)
    }

    func testModelReference() throws {
        let context = JSContext()
        guard let val = JSValue(object: "Hello World", in: context!) else {
            return XCTFail("could not create JSValue")
        }
        let wrapper = try JSONDecoder().decode(ModelReference.self, from: val)

        XCTAssertEqual("Hello World", wrapper.stringValue)
    }
}
