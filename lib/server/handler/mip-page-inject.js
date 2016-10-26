/**
 * @file mip页面注入处理
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
const fs = require('fs');
const path = require('path');
const cli = require('../../cli');
const mipUtil = require('../mip-util');

module.exports = function () {
    return function (context) {
        const baseDir = context.config.baseDir;
        const pathname = context.req._parsedUrl.pathname;
        const filePath = path.join(baseDir, pathname);
        if (!fs.existsSync(filePath)) {
            return;
        }

        cli.info('process page inject', pathname);
        let html = fs.readFileSync(filePath, 'utf8');
        // 配置了组件目录，则增加组件注入
        if (context.config.extensionsDir) {
            require('../mip-util').pageInject();
        }

        // livereload配置
        if (context.config.livereload) {
            html = mipUtil.livereloadInject(html);
        }

        context.res.header('content-type', 'text/html');
        context.res.send(html);
        context.end();
    };
};
