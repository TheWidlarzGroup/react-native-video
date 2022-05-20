import { NativeModules, NativeEventEmitter, Platform, AppState } from 'react-native';
import _ from 'lodash';
import storageService from 'rn-multi-tenant-async-storage';

import Download, { DOWNLOAD_STATES, EVENT_LISTENER_TYPES } from './download';

const tenantKey = 'RNMediaSuite_DownloadManager';

class DownloadManager {
    constructor() {
        if (!DownloadManager.downloader) {
            storageService.addStorageTenant(tenantKey);
            this.tenant = storageService.getStorageTenant(tenantKey);

            this.restoreMediaDownloader = this.restoreMediaDownloader.bind(this);
            this.setMaxSimultaneousDownloads = this.setMaxSimultaneousDownloads.bind(this);
            this.createNewDownload = this.createNewDownload.bind(this);
            this.deleteDownloaded = this.deleteDownloaded.bind(this);
            this.onDownloadStarted = this.onDownloadStarted.bind(this);
            this.onDownloadProgress = this.onDownloadProgress.bind(this);
            this.onDownloadFinished = this.onDownloadFinished.bind(this);
            this.onDownloadError = this.onDownloadError.bind(this);
            this.onDownloadCancelled = this.onDownloadCancelled.bind(this);
            this.onDownloadPaused = this.onDownloadPaused.bind(this);
            this.onDownloadResumed = this.onDownloadResumed.bind(this);

            this.addUpdateListener = this.addUpdateListener.bind(this);
            this.callUpdateListeners = this.callUpdateListeners.bind(this);
            this.removeUpdateListener = this.removeUpdateListener.bind(this);

            this.handleAppStateChange = this.handleAppStateChange.bind(this);

            this.getDownload = this.getDownload.bind(this);
            this.isDownloaded = this.isDownloaded.bind(this);
            this.checkIfStillDownloaded = this.checkIfStillDownloaded.bind(this);
            this.persistDownload = this.persistDownload.bind(this);

            this.downloads = [];
            this.updateListeners = [];

            this.nativeDownloader = NativeModules.MediaDownloader;
            const downloaderEvent = new NativeEventEmitter(NativeModules.MediaDownloader);

            downloaderEvent.addListener('onDownloadFinished', this.onDownloadFinished);
            downloaderEvent.addListener('onDownloadProgress', this.onDownloadProgress);
            downloaderEvent.addListener('onDownloadStarted', this.onDownloadStarted);
            downloaderEvent.addListener('onDownloadError', this.onDownloadError);
            downloaderEvent.addListener('onDownloadCancelled', this.onDownloadCancelled);

            AppState.addEventListener('change', this.handleAppStateChange);

            DownloadManager.downloader = this;
        }

        return DownloadManager.downloader;
    }

    restoreMediaDownloader() {
        return new Promise((resolve, reject) => {
            storageService.getAllKeyValuePairs(this.tenant).then(
                downloads => {
                    let downloadIds = [];
                    _.forEach(downloads, download => {
                        const newDownload = new Download(
                            download[1].downloadID,
                            download[1].remoteURL,
                            download[1].state,
                            download[1].bitRate,
                            download[1].title,
                            download[1].assetArtworkURL,
                            this.nativeDownloader,
                            download[1]
                        );
                        newDownload.addEventListener(
                            EVENT_LISTENER_TYPES.deleted,
                            this.deleteDownloaded
                        );
                        newDownload.addEventListener(
                            EVENT_LISTENER_TYPES.paused,
                            this.onDownloadPaused
                        );
                        newDownload.addEventListener(
                            EVENT_LISTENER_TYPES.resumed,
                            this.onDownloadResumed
                        );
                        this.downloads.push(newDownload);
                        downloadIds.push(download[1].downloadID);
                    });

                    if (Platform.OS === 'ios') {
                        this.nativeDownloader.restoreMediaDownloader().then(() => {
                            this.checkIfStillDownloaded();
                            resolve(downloadIds);
                        });
                    } else {
                        this.checkIfStillDownloaded();
                        resolve(downloadIds);
                    }
                },
                error => {
                    reject(error);
                }
            );
        });
    }

    setMaxSimultaneousDownloads(maxSimultaneousDownloads) {
        if (Platform.OS === 'ios') {
            if (
                typeof maxSimultaneousDownloads !== 'number' ||
                maxSimultaneousDownloads % 1 !== 0
            ) {
                throw 'maxSimultaneousDownloads should be of type integer.';
            }
            this.nativeDownloader.setMaxSimultaneousDownloads(maxSimultaneousDownloads);
        }
    }

    createNewDownload(url, downloadID, title, assetArtworkURL, bitRate = 0) {
        let download = this.downloads.find(download => download.downloadID === downloadID);

        if (download && !download.isFailed()) {
            throw `Download already exists with ID: ${downloadID}`;
        }
        download = new Download(
            downloadID,
            url,
            DOWNLOAD_STATES.initialized,
            bitRate,
            title,
            assetArtworkURL,
            this.nativeDownloader
        );
        this.downloads.push(download);
        download.addEventListener(EVENT_LISTENER_TYPES.deleted, this.deleteDownloaded);
        download.addEventListener(EVENT_LISTENER_TYPES.paused, this.onDownloadPaused);
        download.addEventListener(EVENT_LISTENER_TYPES.resumed, this.onDownloadResumed);
        this.persistDownload(download);
        this.callUpdateListeners(downloadID);
        return download;
    }

    deleteDownloaded(downloadID) {
        this.callUpdateListeners(downloadID);
        _.remove(this.downloads, download => download.downloadID === downloadID);
        storageService.removeItem(this.tenant, downloadID);
    }

    onDownloadStarted(data) {
        let download = this.getDownload(data.downloadID);
        if (!download) return;

        download.onDownloadStarted();
        this.persistDownload(download);
        this.callUpdateListeners(data.downloadID);
    }

    onDownloadProgress(data) {
        let download = this.getDownload(data.downloadID);
        if (!download) return;

        download.onDownloadProgress(data.percentComplete);
        this.persistDownload(download);
        this.callUpdateListeners(data.downloadID);
    }

    onDownloadFinished(data) {
        let download = this.getDownload(data.downloadID);
        if (!download) return;

        download.onDownloadFinished(data.downloadLocation, data.size);
        this.persistDownload(download);
        this.callUpdateListeners(data.downloadID);
    }

    onDownloadError(data) {
        let download = this.getDownload(data.downloadID);
        if (!download) return;

        if (data.errorType === 'UNEXPECTEDLY_CANCELLED') {
            download.retry();
            return;
        }

        download.onDownloadError(data.errorType, data.error);
        console.warn(data.error);
        this.persistDownload(download);
        this.callUpdateListeners(data.downloadID);
    }

    onDownloadCancelled(data) {
        let download = this.getDownload(data.downloadID);
        if (!download) return;

        download.onDownloadCancelled();
        _.remove(this.downloads, download => download.downloadID === data.downloadID);
        storageService.removeItem(this.tenant, data.downloadID);
        this.callUpdateListeners(data.downloadID);
    }

    onDownloadPaused(downloadID) {
        let download = this.getDownload(downloadID);
        if (!download) return;

        this.persistDownload(download);
        this.callUpdateListeners(downloadID);
    }

    onDownloadResumed(downloadID) {
        let download = this.getDownload(downloadID);
        if (!download) return;

        this.persistDownload(download);
        this.callUpdateListeners(downloadID);
    }

    addUpdateListener(listener, options) {
        if (!options.downloadIDs) {
            this.updateListeners.push({ downloadIDs: null, listener: listener });
            listener(this.getDownload(_.map(this.downloads, 'downloadID'), true));
        } else {
            this.updateListeners.push({ downloadIDs: options.downloadIDs, listener });
            if (options.updateImmediately) this.callUpdateListeners(options.downloadIDs[0]);
        }
    }

    callUpdateListeners(downloadID) {
        _.forEach(this.updateListeners, listenerObject => {
            if (_.isArray(listenerObject.downloadIDs)) {
                if (_.includes(listenerObject.downloadIDs, downloadID)) {
                    listenerObject.listener(this.getDownload(listenerObject.downloadIDs, true));
                }
            } else if (listenerObject.downloadIDs) {
                if (listenerObject.downloadIDs === downloadID)
                    listenerObject.listener(this.getDownload(downloadID));
            } else {
                listenerObject.listener(
                    this.getDownload(_.map(this.downloads, 'downloadID'), true)
                );
            }
        });
    }

    handleAppStateChange(nextAppState) {
        if (nextAppState === 'active') {
            this.checkIfStillDownloaded();
        }
    }

    removeUpdateListener(listener) {
        _.remove(this.updateListeners, listenerObject => listenerObject.listener === listener);
    }

    getDownload(downloadIDs, returnWithLabels = false) {
        const matchedDownloads = _.filter(this.downloads, download => {
            if (download.state !== DOWNLOAD_STATES.deleted) {
                if (_.isArray(downloadIDs)) {
                    return _.indexOf(downloadIDs, download.downloadID) !== -1;
                }
                return download.downloadID === downloadIDs;
            }
            return false;
        });

        if (_.isEmpty(matchedDownloads)) {
            return null;
        }

        if (returnWithLabels) {
            const matchedDownloadsWithLabels = {};
            _.forEach(matchedDownloads, matchedDownload => {
                matchedDownloadsWithLabels[matchedDownload.downloadID] = matchedDownload;
            });
            return matchedDownloadsWithLabels;
        }

        if (_.size(matchedDownloads) === 1) {
            return matchedDownloads[0];
        }
        return matchedDownloads;
    }

    isDownloaded(downloadID) {
        return !!this.downloads.find(download => download.downloadID === downloadID);
    }

    checkIfStillDownloaded() {
        let downloadIDs = _.map(this.downloads, download => download.downloadID);
        this.nativeDownloader.checkIfStillDownloaded(downloadIDs).then(downloadedDownloadIDs => {
            if (!_.isEmpty(downloadedDownloadIDs)) {
                let deletedDownloadIDs = _.difference(downloadIDs, downloadedDownloadIDs);
                _.forEach(deletedDownloadIDs, downloadedDownloadID => {
                    const download = _.find(
                        this.downloads,
                        download => download.downloadID === downloadedDownloadID
                    );
                    if (download && download.state !== DOWNLOAD_STATES.failed) download.delete();
                });
            }
        });
    }

    updateDownloadCreds(downloadID, queryParam, cookie) {
        this.nativeDownloader.updateDownloadCreds(downloadID, queryParam, cookie);
    }

    persistDownload(download) {
        storageService.setItem(this.tenant, download.downloadID, {
            downloadID: download.downloadID,
            remoteURL: download.remoteURL,
            state: download.state,
            bitRate: download.bitRate,
            title: download.title,
            assetArtworkURL: download.assetArtworkURL,
            progress: download.progress,
            localURL: download.localURL,
            fileSize: download.fileSize,
            errorType: download.errorType,
            errorMessage: download.errorMessage,
            startedTimeStamp: download.startedTimeStamp,
            finishedTimeStamp: download.finishedTimeStamp,
            erroredTimeStamp: download.erroredTimeStamp,
            progressTimeStamp: download.progressTimeStamp
        });
    }
}

const downloadManager = new DownloadManager();
Object.freeze(downloadManager);

export default downloadManager;
