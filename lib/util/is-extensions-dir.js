/**
 * @file 检查本地项目是否是mip-extensions项目
 *
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
const fs = require('fs');
const path = require('path');

/**
 * 由于mip-extensions项目没有明显标识，需要检查本项目是否是mip-extensions
 * 基于以下规则：
 * 1. 包含mip.config文件的是普通的mip页面项目
 * 2. 第一级目录有任意一个为`mip-xxx`的项目是mip-extensions
 *
 * @param  {string} baseDir 项目根目录
 * @return {Promise}
 */


module.exports = function (baseDir) {
    return new Promise(function (resolve, reject) {
        if (fs.existsSync(path.join(baseDir, 'mip.config'))) {
            resolve(false);
            return;
        }

        fs.readdir(baseDir, function (err, files) {
            let isExtensionsDir = false;
            for (let i = 0, l = files.length; i < l; i++) {
                const stat = fs.statSync(path.join(baseDir, files[i]));
                if (stat.isDirectory() && files[i].match(/^mip-[\w-]+/)) {
                    isExtensionsDir = true;
                    break;
                }
            }

            if (isExtensionsDir) {
                resolve(true);
            }
            else {
                resolve(false);
            }
        });
    });

};
