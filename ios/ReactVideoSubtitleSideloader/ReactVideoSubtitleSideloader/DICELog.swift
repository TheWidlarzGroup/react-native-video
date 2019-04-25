//
//  DiceLog.swift
//  RNDReactNativeDiceVideo
//
//  Created by Lukasz on 11/04/2019.
//  Copyright © 2019 Endeavor Streaming. All rights reserved.
//

//#if DEBUG && !DICELOG_DISABLED
let DICELOG_IS_ACTIVE = true
//#else
//let DICELOG_IS_ACTIVE = false
//#endif

import UIKit

class DICELog {
    enum Level: Int, Equatable, Comparable {
        static func < (lhs: DICELog.Level, rhs: DICELog.Level) -> Bool {
            return lhs.rawValue < rhs.rawValue
        }
        
        public static func <= (lhs: DICELog.Level, rhs: DICELog.Level) -> Bool {
            return lhs.rawValue <= rhs.rawValue
        }
        
        public static func >= (lhs: DICELog.Level, rhs: DICELog.Level) -> Bool {
            return lhs.rawValue >= rhs.rawValue
        }
        
        public static func > (lhs: DICELog.Level, rhs: DICELog.Level) -> Bool {
            return lhs.rawValue > rhs.rawValue
        }
        
        case none
        case error
        case warning
        case debug
        case verbose
    }
    
    public static var logPrefix: String  = "DICEPlayer"//"DICELog"
    public static var logLevel: Level = .verbose
    
    private static func getFileName(_ filePath: String) -> String {
        return NSURL(fileURLWithPath: filePath).deletingPathExtension?.lastPathComponent ?? ""
    }
    
    private static func prepareLine(_ type: String, _ file: String, _ function: String, _ line: Int) -> String {
        var s = "\(DICELog.logPrefix) [\(type)] \(DICELog.getFileName(file)) \(function) \(line)"
        if s.count < 75 {
            s = s.padding(toLength: 75, withPad: " ", startingAt: 0)
        }
        return s
    }
    
    public static func d(file: String = #file, line: Int = #line, function: String = #function, _ message: String = "", args: CVarArg...) {
        if DICELOG_IS_ACTIVE && logLevel >= .debug {
            var msg = message
            if (args.count == 0) {
                msg = msg.safeForLogger()
            }
            
           NSLog("\(prepareLine("DEBUG", file, function, line)) \(msg)", args)
        }
    }
    
    public static func e(file: String = #file, line: Int = #line, function: String = #function, _ message: String = "", args: CVarArg...) {
        if DICELOG_IS_ACTIVE && logLevel >= .error {
            var msg = message
            if (args.count == 0) {
                msg = msg.safeForLogger()
            }
            NSLog("\(prepareLine("ERROR", file, function, line)) \(msg)", args)
        }
    }
    
    public static func w(file: String = #file, line: Int = #line, function: String = #function, _ message: String = "", args: CVarArg...) {
        if DICELOG_IS_ACTIVE && logLevel >= .warning {
            var msg = message
            if (args.count == 0) {
                msg = msg.safeForLogger()
            }
            NSLog("\(prepareLine("WARNING", file, function, line)) \(msg)", args)
        }
    }
    
    public static func v(file: String = #file, line: Int = #line, function: String = #function, _ message: String = "", args: CVarArg...) {
        if DICELOG_IS_ACTIVE && logLevel >= .verbose {
            var msg = message
            if (args.count == 0) {
                msg = msg.safeForLogger()
            }
            NSLog("\(prepareLine("VERBOSE", file, function, line)) \(msg)", args)
        }
    }
}
