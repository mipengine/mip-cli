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
        // 过滤掉html注释，防止注入注释中的代码
        html = html.replace(/<!--[\s\S]*?-->/g, '');
        // 配置了组件目录，则增加组件注入
        if (context.config.extensionsDir) {
            html = require('../mip-util').pageInject(html);
        }

        // 配置了定制化mip目录
        if (context.config.mipCustomDir && !context.config.extensionsDir) {
            html = require('../mip-util').pageCustomInject(html);
        }

        // 配置了mip目录，则增加mip注入
        if (context.config.mipDir) {
            html = require('../mip-util').mipmaiInject(html);
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
