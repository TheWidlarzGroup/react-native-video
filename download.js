import _ from 'lodash';
import { Platform } from 'react-native';

export const DOWNLOAD_STATES = Object.freeze({
    initialized: 'INITIALIZED',
    started: 'STARTED',
    downloading: 'DOWNLOADING',
    downloaded: 'DOWNLOADED',
    paused: 'PAUSED',
    failed: 'FAILED',
    deleted: 'DELETED'
});

export const EVENT_LISTENER_TYPES = Object.freeze({
    started: 'STARTED',
    progress: 'PROGRESS',
    finished: 'FINISHED',
    error: 'ERROR',
    cancelled: 'CANCELLED',
    deleted: 'DELETED',
    paused: 'PAUSED',
    resumed: 'RESUMED'
});

export const ERRORS = Object.freeze([
    {
        type: 'ALREADY_DOWNLOADED',
        description: 'The asset is already downloaded or downloading.',
        code: '01',
        platforms: [Platform.ios, Platform.android]
    },
    {
        type: 'NO_URL',
        description: 'The URL passed to the downloader was empty.',
        code: '02',
        platforms: [Platform.ios]
    },
    {
        type: 'DOWNLOAD_TASK_ERROR',
        description: 'Failed to create download task for a unknown reason.',
        code: '03',
        platforms: [Platform.ios]
    },
    {
        type: 'NOT_SUPPORTED',
        description: 'Downloads are not supported on the current device.',
        code: '04',
        platforms: [Platform.ios]
    },
    {
        type: 'DELETE_FAILED',
        description: 'An error occurred while deleting the download.',
        code: '05',
        platforms: [Platform.ios]
    },
    {
        type: 'NOT_FOUND',
        description: 'The native downloader could not find the download.',
        code: '06',
        platforms: [Platform.ios]
    },
    {
        type: 'PAUSE_FAILED',
        description: 'Tried to pause a download that has already finished downloading.',
        code: '07',
        platforms: [Platform.ios]
    },
    {
        type: 'RESUME_FAILED',
        description: 'Tried to resume a download that has already finished downloading.',
        code: '08',
        platforms: [Platform.ios]
    },
    {
        type: 'UNEXPECTEDLY_CANCELLED',
        description: 'The download was unexpectedly cancelled.',
        code: '09',
        platforms: [Platform.ios]
    },
    {
        type: 'SIMULATOR_NOT_SUPPORTED',
        description: 'Downloading HLS streams is not supported in the simulator.',
        code: '10',
        platforms: [Platform.ios]
    },
    {
        type: 'DUPLICATE_URI',
        description: 'Duplicate asset for the uri found.',
        code: '11',
        platforms: [Platform.android]
    },
    {
        type: 'UNKNOWN',
        description: 'An unexpected error occurred',
        code: '12',
        platforms: [Platform.ios]
    }
]);

export default class Download {
    constructor(
        downloadID,
        remoteURL,
        state,
        bitRate,
        title,
        assetArtworkURL,
        nativeDownloader,
        restoreDownloadFields
    ) {
        this.downloadID = downloadID.toString();
        this.remoteURL = remoteURL;
        this.state = state;
        this.bitRate = bitRate || 0;
        this.title = title;
        this.assetArtworkURL = assetArtworkURL;

        this.nativeDownloader = nativeDownloader;

        this.eventListeners = [];

        this.startedTimeStamp = null;
        this.finishedTimeStamp = null;
        this.erroredTimeStamp = null;
        this.progressTimeStamp = null;

        this.restoreDownload = this.restoreDownload.bind(this);
        this.start = this.start.bind(this);
        this.pause = this.pause.bind(this);
        this.resume = this.resume.bind(this);
        this.cancel = this.cancel.bind(this);
        this.delete = this.delete.bind(this);
        this.isDestroyed = this.isDestroyed.bind(this);
        this.destroy = this.destroy.bind(this);
        this.addEventListener = this.addEventListener.bind(this);
        this.removeEventListener = this.removeEventListener.bind(this);
        this.callEventListeners = this.callEventListeners.bind(this);

        this.onDownloadStarted = this.onDownloadStarted.bind(this);
        this.onDownloadProgress = this.onDownloadProgress.bind(this);
        this.onDownloadFinished = this.onDownloadFinished.bind(this);
        this.onDownloadCancelled = this.onDownloadCancelled.bind(this);

        this.isInitialized = this.isInitialized.bind(this);
        this.isStarted = this.isStarted.bind(this);
        this.isDownloading = this.isDownloading.bind(this);
        this.isDownloaded = this.isDownloaded.bind(this);
        this.isCancelled = this.isCancelled.bind(this);
        this.isPaused = this.isPaused.bind(this);
        this.isFailed = this.isFailed.bind(this);

        if (restoreDownloadFields) {
            this.restoreDownload(restoreDownloadFields);
        }
    }

    restoreDownload(downloadFields) {
        this.downloadID = downloadFields.downloadID;
        this.remoteURL = downloadFields.remoteURL;
        this.state = downloadFields.state;
        this.bitRate = downloadFields.bitRate;
        this.progress = downloadFields.progress;
        this.localURL = downloadFields.localURL;
        this.fileSize = downloadFields.fileSize;
        this.errorType = downloadFields.errorType;
        this.errorMessage = downloadFields.errorMessage;
        this.startedTimeStamp = downloadFields.startedTimeStamp;
        this.finishedTimeStamp = downloadFields.finishedTimeStamp;
        this.erroredTimeStamp = downloadFields.erroredTimeStamp;
        this.progressTimeStamp = downloadFields.progressTimeStamp;
    }

    start(retry) {
        this.isDestroyed();

        if (Platform.OS === 'ios') {
            if (this.bitRate) {
                this.nativeDownloader.downloadStreamWithBitRate(
                    this.remoteURL,
                    this.downloadID,
                    this.title,
                    this.assetArtworkURL,
                    Boolean(retry),
                    this.bitRate
                );
            } else {
                this.nativeDownloader.downloadStream(
                    this.remoteURL,
                    this.downloadID,
                    this.title,
                    this.assetArtworkURL,
                    Boolean(retry)
                );
            }
        } else {
            if (this.bitRate) {
                this.nativeDownloader.downloadStreamWithBitRate(
                    this.remoteURL,
                    this.downloadID,
                    this.bitRate
                );
            } else {
                this.nativeDownloader.downloadStream(this.remoteURL, this.downloadID);
            }
        }
    }

    pause() {
        this.isDestroyed();

        this.nativeDownloader.pauseDownload(this.downloadID);
        this.state = DOWNLOAD_STATES.paused;
        this.callEventListeners(EVENT_LISTENER_TYPES.paused, this.downloadID);
    }

    resume() {
        this.isDestroyed();

        this.nativeDownloader.resumeDownload(this.downloadID);
        this.state = DOWNLOAD_STATES.downloading;
        this.callEventListeners(EVENT_LISTENER_TYPES.resumed, this.downloadID);
    }

    cancel() {
        this.isDestroyed();

        this.nativeDownloader.cancelDownload(this.downloadID);
    }

    delete() {
        this.isDestroyed();

        this.nativeDownloader.deleteDownloadedStream(this.downloadID);
        this.state = DOWNLOAD_STATES.deleted;
        this.callEventListeners(EVENT_LISTENER_TYPES.deleted, this.downloadID);
        this.destroy();
    }

    retry() {
        this.isDestroyed();

        this.start(true);
    }

    isDestroyed() {
        if (this.state === DOWNLOAD_STATES.deleted || !this.state)
            throw 'Download has been deleted.';
    }

    addEventListener(type, listener) {
        this.isDestroyed();

        this.eventListeners.push({ type, listener });
    }

    removeEventListener(listener) {
        this.isDestroyed();
        _.remove(this.eventListeners, eventListener => eventListener === listener);
    }

    callEventListeners(type, data) {
        _.forEach(this.eventListeners, eventListener => {
            if (eventListener.type === type) {
                eventListener.listener(data);
            }
        });
    }

    destroy() {
        this.downloadID = undefined;
        this.remoteURL = undefined;
        this.state = DOWNLOAD_STATES.deleted;
        this.bitRate = undefined;
        this.title = undefined;
        this.assetArtworkURL = undefined;
        this.progress = undefined;
        this.localURL = undefined;
        this.fileSize = undefined;
        this.errorType = undefined;
        this.errorMessage = undefined;

        this.nativeDownloader = undefined;
    }

    onDownloadStarted() {
        this.isDestroyed();

        this.state = DOWNLOAD_STATES.started;
        this.startedTimeStamp = Date.now();

        this.callEventListeners(EVENT_LISTENER_TYPES.started);
    }

    onDownloadProgress(progress) {
        this.isDestroyed();

        if (!this.isPaused()) this.state = DOWNLOAD_STATES.downloading;
        this.progress = progress;

        this.callEventListeners(EVENT_LISTENER_TYPES.progress, progress);
    }

    onDownloadFinished(downloadLocation, size) {
        this.isDestroyed();

        this.state = DOWNLOAD_STATES.downloaded;
        this.localURL = downloadLocation;
        this.fileSize = size;
        this.finishedTimeStamp = Date.now();

        this.callEventListeners(EVENT_LISTENER_TYPES.finished, { downloadLocation, size });
    }

    onDownloadError(errorType) {
        this.isDestroyed();

        let errorObject = _.find(ERRORS, error => error.type === errorType);
        if (!errorObject) {
            errorObject = _.find(ERRORS, error => (error.code = '12'));
        }

        if (errorObject.type !== _.find(ERRORS, error => error.code === '01').type) {
            this.state = DOWNLOAD_STATES.failed;
        }
        this.errorType = errorObject.type;
        this.errorMessage = errorObject.description;
        this.erroredTimeStamp = Date.now();

        this.callEventListeners(EVENT_LISTENER_TYPES.error, {
            errorType: errorObject.type,
            errorMessage: errorObject.description
        });
    }

    onDownloadCancelled() {
        this.isDestroyed();

        this.delete();
        this.callEventListeners(EVENT_LISTENER_TYPES.cancelled);
    }

    isInitialized() {
        this.isDestroyed();

        return this.state === DOWNLOAD_STATES.initialized;
    }

    isStarted() {
        this.isDestroyed();

        return this.state === DOWNLOAD_STATES.started;
    }

    isDownloading() {
        this.isDestroyed();

        return this.state === DOWNLOAD_STATES.downloading;
    }

    isDownloaded() {
        this.isDestroyed();

        return this.state === DOWNLOAD_STATES.downloaded;
    }

    isCancelled() {
        this.isDestroyed();

        return this.state === DOWNLOAD_STATES.isCancelled;
    }

    isPaused() {
        this.isDestroyed();

        return this.state === DOWNLOAD_STATES.paused;
    }

    isFailed() {
        this.isDestroyed();

        return this.state === DOWNLOAD_STATES.failed;
    }
}
