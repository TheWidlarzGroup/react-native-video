package com.brentvatne.exoplayer;

import androidx.media3.common.Format;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.C;
import androidx.media3.extractor.Extractor;
import androidx.media3.extractor.ExtractorInput;
import androidx.media3.extractor.ExtractorOutput;
import androidx.media3.extractor.PositionHolder;
import androidx.media3.extractor.SeekMap;
import androidx.media3.extractor.TrackOutput;
import androidx.media3.extractor.text.SubtitleExtractor;

import java.io.IOException;

public final class UnknownSubtitlesExtractor implements Extractor {
    private final Format format;

    public UnknownSubtitlesExtractor(Format format) {
      this.format = format;
    }

    @Override
    public boolean sniff(ExtractorInput input) {
      return true;
    }

    @Override
    public void init(ExtractorOutput output) {
      TrackOutput trackOutput = output.track(SubtitleExtractor.TRACK_ID, C.TRACK_TYPE_TEXT);
      output.seekMap(new SeekMap.Unseekable(C.TIME_UNSET));
      output.endTracks();
      trackOutput.format(
          format
              .buildUpon()
              .setSampleMimeType(MimeTypes.TEXT_UNKNOWN)
              .setCodecs(format.sampleMimeType)
              .build());
    }

    @Override
    public int read(ExtractorInput input, PositionHolder seekPosition) throws IOException {
      int skipResult = input.skip(Integer.MAX_VALUE);
      if (skipResult == C.RESULT_END_OF_INPUT) {
        return RESULT_END_OF_INPUT;
      }
      return RESULT_CONTINUE;
    }

    @Override
    public void seek(long position, long timeUs) {}

    @Override
    public void release() {}
  }