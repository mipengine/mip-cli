/**
 * @file 定制化 MIP 组件预览功能
 * @author wupeng(smartfutureplayer@gmail.com)
 */

'use strict';
const fs = require('fs');
const charset = 'utf-8';
const path = require('path');

module.exports = {
    isValidFile: function (pth) {
        return pth.match(/\.(css|less|sass|js|json|html|md)$/);
    },

    isCSS: function (pth) {
        return pth.match(/\.css|less|sass$/);
    },

    isJS: function (pth) {
        return pth.match(/\.js$/);
    },

    isHTML: function (pth) {
        return pth.match(/\.html$/);
    },

    isOther: function (pth) {
        return pth.match(/\.(json|md)$/);
    },

    writeFile: function (pth, content) {
        if (!pth || !content) {
            return;
        }
        fs.writeFileSync(pth, content);
    },

    readFile: function (pth) {
        if (!pth) {
            return;
        }
        return fs.readFileSync(pth, charset);
    },

    cssScope: function (pth) {
        let ct = '';
        let files = pth.split('/');
        let baseName = files[files.length - 2];
        let cssScope = this.readFile(pth)
        .replace(/(\/\*(.|\s)*?\*\/)/g, '')
        .replace(/(^|\s|[^'":\w\d\\])(\/\/(?!m\.baidu)[^\r\n]*)/g, '')
        .replace(/\n/g, '')
        .split(/\}/g).filter(function (line) {
            if (line) {
                line = line.trim();
                ct += baseName + ' ' + line + '}';
            }
        });
        return ct;
    }
};
