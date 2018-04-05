

#import "AudioTapProcessor.h"

#import <AVFoundation/AVFoundation.h>


// This struct is used to pass along data between the MTAudioProcessingTap callbacks.
typedef struct AVAudioTapProcessorContext {
	Boolean supportedTapProcessingFormat;
	Boolean isNonInterleaved;
	Float64 sampleRate;
	AudioUnit audioUnit;
	Float64 sampleCount;
	float leftChannelVolume;
	float rightChannelVolume;
	void *self;
} AVAudioTapProcessorContext;

// MTAudioProcessingTap callbacks.
static void tap_InitCallback(MTAudioProcessingTapRef tap, void *clientInfo, void **tapStorageOut);
static void tap_FinalizeCallback(MTAudioProcessingTapRef tap);
static void tap_PrepareCallback(MTAudioProcessingTapRef tap, CMItemCount maxFrames, const AudioStreamBasicDescription *processingFormat);
static void tap_UnprepareCallback(MTAudioProcessingTapRef tap);
static void tap_ProcessCallback(MTAudioProcessingTapRef tap, CMItemCount numberFrames, MTAudioProcessingTapFlags flags, AudioBufferList *bufferListInOut, CMItemCount *numberFramesOut, MTAudioProcessingTapFlags *flagsOut);

// Audio Unit callbacks.
static OSStatus AU_RenderCallback(void *inRefCon, AudioUnitRenderActionFlags *ioActionFlags, const AudioTimeStamp *inTimeStamp, UInt32 inBusNumber, UInt32 inNumberFrames, AudioBufferList *ioData);

@interface AudioTapProcessor ()
{
	AVAudioMix *_audioMix;
}
@end

@implementation AudioTapProcessor

- (id) initWithAVPlayerItem: (AVPlayerItem *)playerItem
{
    if (playerItem && playerItem.tracks){
        for (AVPlayerItemTrack *track in playerItem.tracks){
            if ([track.assetTrack.mediaType isEqualToString:AVMediaTypeAudio])
                return [self initWithAudioAssetTrack: track.assetTrack];
        }
    }
    return nil;
}

- (id)initWithAudioAssetTrack:(AVAssetTrack *)audioAssetTrack
{
	NSParameterAssert(audioAssetTrack && [audioAssetTrack.mediaType isEqualToString:AVMediaTypeAudio]);
	
	self = [super init];
	
	if (self){
		_audioAssetTrack = audioAssetTrack;
	}
	return self;
}

#pragma mark - Properties

- (AVAudioMix *)audioMix
{
	if (!_audioMix)
	{
		AVMutableAudioMix *audioMix = [AVMutableAudioMix audioMix];
		if (audioMix)
		{
			AVMutableAudioMixInputParameters *audioMixInputParameters = [AVMutableAudioMixInputParameters audioMixInputParametersWithTrack:self.audioAssetTrack];
			if (audioMixInputParameters)
			{
				MTAudioProcessingTapCallbacks callbacks;
				
				callbacks.version       = kMTAudioProcessingTapCallbacksVersion_0;
				callbacks.clientInfo    = (__bridge void *)self,
				callbacks.init          = tap_InitCallback;
				callbacks.finalize      = tap_FinalizeCallback;
				callbacks.prepare       = tap_PrepareCallback;
				callbacks.unprepare     = tap_UnprepareCallback;
				callbacks.process       = tap_ProcessCallback;
				
				MTAudioProcessingTapRef audioProcessingTap;
				if (noErr == MTAudioProcessingTapCreate(kCFAllocatorDefault, &callbacks, kMTAudioProcessingTapCreationFlag_PreEffects, &audioProcessingTap))
				{
					audioMixInputParameters.audioTapProcessor = audioProcessingTap;
					
					CFRelease(audioProcessingTap);
					
					audioMix.inputParameters = @[audioMixInputParameters];
					
					_audioMix = audioMix;
				}
			}
		}
	}
	
	return _audioMix;
}


#pragma mark -

- (void)updateLeftChannelVolume:(float)leftChannelVolume rightChannelVolume:(float)rightChannelVolume
{
	@autoreleasepool
	{
		dispatch_async(dispatch_get_main_queue(), ^{
			// Forward left and right channel volume to delegate.
			if (self.delegate && [self.delegate respondsToSelector:@selector(audioTabProcessor:hasNewLeftChannelValue:rightChannelValue:)])
				[self.delegate audioTabProcessor:self hasNewLeftChannelValue:leftChannelVolume rightChannelValue:rightChannelVolume];
		});
	}
}

@end

#pragma mark - MTAudioProcessingTap Callbacks

static void tap_InitCallback(MTAudioProcessingTapRef tap, void *clientInfo, void **tapStorageOut)
{
	AVAudioTapProcessorContext *context = calloc(1, sizeof(AVAudioTapProcessorContext));
	
	// Initialize MTAudioProcessingTap context.
	context->supportedTapProcessingFormat = false;
	context->isNonInterleaved = false;
	context->sampleRate = NAN;
	context->audioUnit = NULL;
	context->sampleCount = 0.0f;
	context->leftChannelVolume = 0.0f;
	context->rightChannelVolume = 0.0f;
	context->self = clientInfo;
	
	*tapStorageOut = context;
}

static void tap_FinalizeCallback(MTAudioProcessingTapRef tap)
{
	AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(tap);
	
	// Clear MTAudioProcessingTap context.
	context->self = NULL;
	
	free(context);
}

static void tap_PrepareCallback(MTAudioProcessingTapRef tap, CMItemCount maxFrames, const AudioStreamBasicDescription *processingFormat)
{
	AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(tap);
	
	// Store sample rate for -setCenterFrequency:.
	context->sampleRate = processingFormat->mSampleRate;
	
	/* Verify processing format (this is not needed for Audio Unit, but for RMS calculation). */
	
	context->supportedTapProcessingFormat = true;
	
	if (processingFormat->mFormatID != kAudioFormatLinearPCM)
	{
		NSLog(@"Unsupported audio format ID for audioProcessingTap. LinearPCM only.");
		context->supportedTapProcessingFormat = false;
	}
	
	if (!(processingFormat->mFormatFlags & kAudioFormatFlagIsFloat))
	{
		NSLog(@"Unsupported audio format flag for audioProcessingTap. Float only.");
		context->supportedTapProcessingFormat = false;
	}
	
	if (processingFormat->mFormatFlags & kAudioFormatFlagIsNonInterleaved)
	{
		context->isNonInterleaved = true;
	}
	
	/* Create bandpass filter Audio Unit */
	
	AudioUnit audioUnit;
	
	AudioComponentDescription audioComponentDescription;
	audioComponentDescription.componentType = kAudioUnitType_Effect;
	audioComponentDescription.componentSubType = kAudioUnitSubType_DynamicsProcessor;
	audioComponentDescription.componentManufacturer = kAudioUnitManufacturer_Apple;
	audioComponentDescription.componentFlags = 0;
	audioComponentDescription.componentFlagsMask = 0;
	
	AudioComponent audioComponent = AudioComponentFindNext(NULL, &audioComponentDescription);
	if (audioComponent)
	{
		if (noErr == AudioComponentInstanceNew(audioComponent, &audioUnit))
		{
			OSStatus status = noErr;
			
			// Set audio unit input/output stream format to processing format.
			if (noErr == status)
			{
				status = AudioUnitSetProperty(audioUnit, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Input, 0, processingFormat, sizeof(AudioStreamBasicDescription));
			}
			if (noErr == status)
			{
				status = AudioUnitSetProperty(audioUnit, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Output, 0, processingFormat, sizeof(AudioStreamBasicDescription));
			}
			
            // Setting for compression
            if (noErr == status)
			{
				status =  AudioUnitSetParameter(audioUnit, kDynamicsProcessorParam_MasterGain, kAudioUnitScope_Global, 0, 10, 0);
			}
            
            if (noErr == status)
			{
               status =   AudioUnitSetParameter(audioUnit, kDynamicsProcessorParam_ExpansionRatio, kAudioUnitScope_Global, 0, 10, 0);
            }
            
			// Set audio unit render callback.
			if (noErr == status)
			{
				AURenderCallbackStruct renderCallbackStruct;
				renderCallbackStruct.inputProc = AU_RenderCallback;
				renderCallbackStruct.inputProcRefCon = (void *)tap;
				status = AudioUnitSetProperty(audioUnit, kAudioUnitProperty_SetRenderCallback, kAudioUnitScope_Input, 0, &renderCallbackStruct, sizeof(AURenderCallbackStruct));
			}
			
			// Set audio unit maximum frames per slice to max frames.
			if (noErr == status)
			{
				UInt32 maximumFramesPerSlice = (unsigned int)maxFrames;
				status = AudioUnitSetProperty(audioUnit, kAudioUnitProperty_MaximumFramesPerSlice, kAudioUnitScope_Global, 0, &maximumFramesPerSlice, (UInt32)sizeof(UInt32));
			}
			
			// Initialize audio unit.
			if (noErr == status)
			{
				status = AudioUnitInitialize(audioUnit);
			}
			
			if (noErr != status)
			{
				AudioComponentInstanceDispose(audioUnit);
				audioUnit = NULL;
			}
			
			context->audioUnit = audioUnit;
		}
	}
}

static void tap_UnprepareCallback(MTAudioProcessingTapRef tap)
{
	AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(tap);
	
	/* Release bandpass filter Audio Unit */
	
	if (context->audioUnit)
	{
		AudioUnitUninitialize(context->audioUnit);
		AudioComponentInstanceDispose(context->audioUnit);
		context->audioUnit = NULL;
	}
}

static void tap_ProcessCallback(MTAudioProcessingTapRef tap, CMItemCount numberFrames, MTAudioProcessingTapFlags flags, AudioBufferList *bufferListInOut, CMItemCount *numberFramesOut, MTAudioProcessingTapFlags *flagsOut)
{
	AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(tap);
	
	OSStatus status;
	
    if (!context) return;
    
	// Skip processing when format not supported.
	if (!context->supportedTapProcessingFormat)
	{
		NSLog(@"Unsupported tap processing format.");
		return;
	}
    
	AudioTapProcessor *self = ((__bridge AudioTapProcessor *)context->self);
    if (!self) return;

	if (self.compressorEnabled)
	{
		// Apply bandpass filter Audio Unit.
		AudioUnit audioUnit = context->audioUnit;
		if (audioUnit)
		{
			AudioTimeStamp audioTimeStamp;
			audioTimeStamp.mSampleTime = context->sampleCount;
			audioTimeStamp.mFlags = kAudioTimeStampSampleTimeValid;
			
			status = AudioUnitRender(audioUnit, 0, &audioTimeStamp, 0, (UInt32)numberFrames, bufferListInOut);
			if (noErr != status)
			{
				NSLog(@"AudioUnitRender(): %d", (int)status);
				return;
			}
			
			// Increment sample count for audio unit.
			context->sampleCount += numberFrames;
			
			// Set number of frames out.
			*numberFramesOut = numberFrames;
		}
	}
	else
	{
		// Get actual audio buffers from MTAudioProcessingTap (AudioUnitRender() will fill bufferListInOut otherwise).
		status = MTAudioProcessingTapGetSourceAudio(tap, numberFrames, bufferListInOut, flagsOut, NULL, numberFramesOut);
		if (noErr != status)
		{
			NSLog(@"MTAudioProcessingTapGetSourceAudio: %d", (int)status);
			return;
		}
	}

	// Calculate root mean square (RMS) for left and right audio channel.
	for (CMItemCount i = 0; i < bufferListInOut->mNumberBuffers; i++)
	{
		AudioBuffer *pBuffer = &bufferListInOut->mBuffers[i];
		UInt32 cSamples = (unsigned int)numberFrames * (context->isNonInterleaved ? 1 : pBuffer->mNumberChannels);
		
		float *pData = (float *)pBuffer->mData;
		
        if (pData){        
            float rms = 0.0f;
            for (UInt32 j = 0; j < cSamples; j++)
            {
                rms += pData[j] * pData[j];
            }
            if (cSamples > 0)
            {
                rms = sqrtf(rms / cSamples);
            }
            
            if (0 == i)
            {
                context->leftChannelVolume = rms;
            }
            if (1 == i || (0 == i && 1 == bufferListInOut->mNumberBuffers))
            {
                context->rightChannelVolume = rms;
            }
        }
	}
	
	// Pass calculated left and right channel volume to VU meters.
	[self updateLeftChannelVolume:context->leftChannelVolume rightChannelVolume:context->rightChannelVolume];
}

#pragma mark - Audio Unit Callbacks

OSStatus AU_RenderCallback(void *inRefCon, AudioUnitRenderActionFlags *ioActionFlags, const AudioTimeStamp *inTimeStamp, UInt32 inBusNumber, UInt32 inNumberFrames, AudioBufferList *ioData)
{
	// Just return audio buffers from MTAudioProcessingTap.
	return MTAudioProcessingTapGetSourceAudio(inRefCon, inNumberFrames, ioData, NULL, NULL, NULL);
}
