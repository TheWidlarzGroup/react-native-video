//
//  RCTVideoSwiftLog.swift
//  WebViewExample
//
//  Created by Jimmy Dee on 4/5/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

/*
 * Under at least some conditions, output from NSLog has been unavailable in the RNBranch module.
 * Hence that module uses the RCTLog macros from <React/RCTLog.h>. The React logger is nicer than
 * NSLog anyway, since it provides log levels with runtime filtering, file and line context and
 * an identifier for the thread that logged the message.
 *
 * This wrapper lets you use functions with the same name in Swift. For example:
 *
 * RCTLogInfo("application launched")
 *
 * generates
 *
 * 2017-04-06 12:31:09.611 [info][tid:main][AppDelegate.swift:18] application launched
 *
 * This is currently part of this sample app. There may be some issues integrating it into an
 * Objective-C library, either react-native-branch or react-native itself, but it may find its
 * way into one or the other eventually. Feel free to reuse it as desired.
 */

let logHeader: String = "RNV:"

func RCTLogError(_ message: String, _ file: String = #file, _ line: UInt = #line) {
    RCTVideoSwiftLog.error(logHeader + message, file: file, line: line)
}

func RCTLogWarn(_ message: String, _ file: String = #file, _ line: UInt = #line) {
    RCTVideoSwiftLog.warn(logHeader + message, file: file, line: line)
}

func RCTLogInfo(_ message: String, _ file: String = #file, _ line: UInt = #line) {
    RCTVideoSwiftLog.info(logHeader + message, file: file, line: line)
}

func RCTLog(_ message: String, _ file: String = #file, _ line: UInt = #line) {
    RCTVideoSwiftLog.log(logHeader + message, file: file, line: line)
}

func RCTLogTrace(_ message: String, _ file: String = #file, _ line: UInt = #line) {
    RCTVideoSwiftLog.trace(logHeader + message, file: file, line: line)
}

func DebugLog(_ message: String) {
    #if DEBUG
        print(logHeader + message)
    #endif
}
