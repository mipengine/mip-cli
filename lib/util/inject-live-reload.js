/**
 * @file 向html页面中注入livereload代码
 *
 * @author mengke01(kekee000@gmail.com)
 */
const getIPAddress = require('./get-ip-address');

function injectLiveReload(html) {
    return html
        + '<script src="http://'
        + getIPAddress()
        +':35729/livereload.js?snipver=1"></script>';
}

module.exports = injectLiveReload;
