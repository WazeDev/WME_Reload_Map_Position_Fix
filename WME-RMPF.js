// ==UserScript==
// @name            WME Reload Map Position Fix
// @namespace       https://greasyfork.org/users/166843
// @description     Keeps track of the current map center and zoom and restores it upon reloading.
// @version         2020.09.08.01
// @author          dBsooner
// @grant           none
// @require         https://greasyfork.org/scripts/24851-wazewrap/code/WazeWrap.js
// @license         GPLv3
// @include         /^https:\/\/(www|beta)\.waze\.com\/(?!user\/)(.{2,6}\/)?editor\/?.*$/
// @contributionURL https://github.com/WazeDev/Thank-The-Authors
// ==/UserScript==

/* global window, localStorage, sessionStorage, W, $, OpenLayers */

const SETTINGS_STORE_NAME = 'WME_RMPF';

let _bootstrapTimeout;

function updatedSavedMapPosition() {
    const storage = { savedCenter: W.map.getCenter(), savedZoom: W.map.getZoom() };
    localStorage.setItem(SETTINGS_STORE_NAME, JSON.stringify(storage));
    sessionStorage.setItem(SETTINGS_STORE_NAME, JSON.stringify(storage));
}

function init() {
    const loadedSettings = $.parseJSON(sessionStorage.getItem(SETTINGS_STORE_NAME)) || $.parseJSON(localStorage.getItem(SETTINGS_STORE_NAME)),
        savedCenter = (loadedSettings) ? loadedSettings.savedCenter : W.map.getCenter(),
        savedZoom = (loadedSettings) ? loadedSettings.savedZoom : W.map.getZoom(),
        currCenter = W.map.getCenter(),
        currZoom = W.map.getZoom();
    if ((currCenter.lon !== savedCenter.lon) || (currCenter.lat !== savedCenter.lat) || (savedZoom !== currZoom))
        W.map.getOLMap().moveTo(new OpenLayers.LonLat([savedCenter.lon, savedCenter.lat], savedZoom));
    W.map.events.register('zoomend', null, updatedSavedMapPosition);
    W.map.events.register('moveend', null, updatedSavedMapPosition);
    window.addEventListener('beforeunload', updatedSavedMapPosition, false);
}

function bootstrap(tries) {
    if (W && W.map && $) {
        window.clearTimeout(_bootstrapTimeout);
        _bootstrapTimeout = undefined;
        init();
    }
    else if (tries < 1000) {
        console.log(`RMPF: Bootstrap failed. Retrying ${tries} of 1000`);
        _bootstrapTimeout = window.setTimeout(bootstrap, 200, ++tries);
    }
    else {
        console.error('RMPF: Bootstrap timed out waiting for WME to become ready.');
    }
}

bootstrap(1);
