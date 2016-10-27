/**
 * @file 获取IP地址
 *
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';

var ipAddress; // 当前暂存的ip地址

module.exports = function () {
    if (ipAddress) {
        return ipAddress;
    }

    let interfaces = require('os').networkInterfaces();
    let keys = Object.keys(interfaces);
    for (let j = 0, devName; devName = keys[j]; j++) {
        let iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            let alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return ipAddress = alias.address;
            }
        }
    }
};
