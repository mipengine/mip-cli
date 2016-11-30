/**
 * @file 处理mip页面注入
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
const cli = require('../cli');
const getIPAddress = require('../util/get-ip-address');

/**
 * mip页面本地脚本注入，将mip页面中的组件替换成本地组件，以方便本地调试
 *
 * @param  {string} content 页面内容
 * @return {string} 注入后内容
 */
exports.pageInject = function (content) {
    const regex = /(<script.+?src=")([^"]+)"/g;
    return content.replace(regex, ($0, script, src) => {
        if (src.indexOf('mipcache.bdstatic.com') < 0) {
            return $0;
        }

        // 处理本地组件注入，符合条件的组件被注入到当前mip页面中
        let m = src.match(/\/(mip-[\w-]+)\b/i);
        if (m) {
            cli.log('\t inject local extension', cli.chalk.green(m[1]));
            return script + '/local-extension-loader?name=' + m[1] + '"';
        }

        return $0;
    });
};

/**
 * livereload页面注入，增加livereload调试
 *
 * @param  {string} content 页面内容
 * @return {string} 注入后内容
 */
exports.livereloadInject = function (content) {
    return content
        + '<script src="http://'
        + getIPAddress()
        + ':35730/livereload.js?snipver=1"></script>';
};

/**
 * mip主项目页面注入，替换mip主项目为本地项目，方便调试
 *
 * @param  {string} content 页面内容
 * @return {string} 注入后内容
 */
exports.mipmaiInject = function (content) {
    cli.log('\t inject local mip');

    // mip.css替换
    const regexCss = /<link.+?href="([^"]+)"/g;
    content = content.replace(regexCss, ($0, src) => {
        if (src.indexOf('/mip.css') > 0 || src.match(/\/mipmain-v\d(?:\.\d)+\.css/)) {
            return $0.replace(src, '/miplocal/dist/mip.css');
        }

        return $0;
    });

    // mip.js替换
    const regexJs = /<script.+?src="([^"]+)"[^<]+<\/script>/g;
    content = content.replace(regexJs, ($0, src) => {
        if (src.indexOf('/mip.js') > 0 || src.indexOf('/mipmain') > 0) {
            return '<script src="/miplocal/dist/mip.js"><' + '/script>';
        }

        return $0;
    });

    return content;
};
