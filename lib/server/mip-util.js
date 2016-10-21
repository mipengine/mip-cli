/**
 * @file 处理mip页面注入
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
const cli = require('../cli');

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

