/**
 * @file mip-project项目handlers
 * @author mengke01(kekee000@gmail.com)
 */

const mipPageInject = require('./handler/mip-page-inject');
const loadExtension = require('./handler/load-extension');
const dirList = require('./handler/dir-list');

module.exports = [
    // mip页面组件
    {
        location: /^\/local-extension-loader/i,
        handlers: [loadExtension()]
    },

    // 配置了本地extension目录，则增加mip页面注入处理
    {
        location: function (path, config) {
            return config.extensionsDir && !!path.match(config.mipPageExt);
        },
        handlers: [mipPageInject()]
    },
    // mip项目目录
    {
        location: function (path) {
            // 过滤常规静态文件
            return !path.match(/\.(?:js|css|png|gif|jpg|bmp|svg|ttf|woff|eot|doc|md)$/i);
        },
        handlers: [dirList()]
    }
];
