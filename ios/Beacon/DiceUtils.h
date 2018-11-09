//
//  DiceUtils.h
//  RCTVideo
//
//  Created by Lukasz on 31/10/2018.
//

#ifndef DiceUtils_h
#define DiceUtils_h

// You can query this value in order to avoid "unused variable" or "unused
// function" warnings, when they are only used by an DICELog call.
#if (defined(DEBUG) && !defined(DICELOG_DISABLED))
#define DICELOG_IS_ACTIVE 1
#else
#define DICELOG_IS_ACTIVE 0
#endif

#if DICELOG_IS_ACTIVE
#define DICELog(s, ...) NSLog( @"[DICE] %@:(%d) %@", [[NSString stringWithUTF8String:__FILE__] lastPathComponent], __LINE__, [NSString stringWithFormat:(s), ##__VA_ARGS__] )
#else
// http://kernelnewbies.org/FAQ/DoWhile0
#define DICELog(s, ...) do { } while (0)
#endif

#endif /* DiceUtils_h */
