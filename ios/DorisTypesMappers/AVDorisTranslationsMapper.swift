//
//  AVDorisTranslationsMapper.swift
//  react-native-video
//
//  Created by Yaroslav Lvov on 10.06.2021.
//

import AVDoris

extension DorisTranslationsViewModel {
    init(translations: Translations) {
        self.init()
        self.stats = translations.playerStatsButton
        self.play = translations.playerPlayButton
        self.pause = translations.playerPauseButton
        self.live = translations.goLive
        self.favourites = translations.favourite
        self.moreVideos = translations.moreVideos
        self.subtitles = translations.captions
        self.rewind = translations.rewind
        self.fastForward = translations.fastForward
        self.audio = translations.audioTracks
        self.info = translations.info
        self.adsCountdownAd = translations.adsCountdownAd
        self.adsCountdownOf = translations.adsCountdownOf
        self.audioAndSubtitles = translations.playerAudioAndSubtitlesButton
        self.annotations = translations.annotations
        self.playingLive = translations.playingLive
        self.nowPlaying = translations.nowPlaying
        self.schedule = translations.tvPlayerEPG
    }
}

extension DorisStyleViewModel {
    init(theme: Theme?) {
        if let theme = theme {
            self.init(primaryColor: UIColor(hexString: theme.colors.primary) ?? .red,
                      secondaryColor: UIColor(hexString: theme.colors.secondary) ?? .white,
                      primaryFont: UIFont(name: theme.fonts.primary, size: 30) ?? .systemFont(ofSize: 30),
                      secondaryFont: UIFont(name: theme.fonts.secondary, size: 20) ?? .systemFont(ofSize: 20),
                      gradientBottomColor: .black)
        } else {
            self.init(primaryColor: .red,
                      secondaryColor: .white,
                      primaryFont: .systemFont(ofSize: 30),
                      secondaryFont: .systemFont(ofSize: 20),
                      gradientBottomColor: .black)
        }
    }
}

extension UIColor {
    convenience init?(hexString: String?, alpha: CGFloat? = nil) {
        guard let hexString = hexString else { return nil }

        let hexStringTrimmed: String = hexString.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines)
        let scanner = Scanner(string: hexString)
        
        if (hexStringTrimmed.hasPrefix("#")) {
            scanner.scanLocation = 1
        }

        let hasAlpha = hexStringTrimmed.count == 8 + scanner.scanLocation
        
        var color: UInt32 = 0
        scanner.scanHexInt32(&color)
        
        let mask:Int64 = 0x000000FF

        let a = hasAlpha ? Int64(color >> 24) & mask : 255
        let r = Int64(color >> 16) & mask
        let g = Int64(color >> 8) & mask
        let b = Int64(color) & mask
        
        let red = CGFloat(r) / 255.0
        let green = CGFloat(g) / 255.0
        let blue = CGFloat(b) / 255.0
        let theAlpha:CGFloat! = alpha != nil ? alpha : (CGFloat(a) / 255.0)
        
        self.init(red: red, green: green, blue: blue, alpha: theAlpha)
    }
}
