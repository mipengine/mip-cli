/**
 * @file mip-project项目handlers
 * @author mengke01(kekee000@gmail.com)
 */

const mipPageInject = require('./handler/mip-page-inject');
const mipExtensionLoad = require('./handler/mip-extension-load');
const mipExtensionLoadSync = require('./handler/mip-extension-load-sync');
const dirList = require('./handler/dir-list');

module.exports = [
    // 异步加载的模块处理
    {
        location: /^\/mip-[\-\w]+\/.+?\.(?:js|css|less)/i,
        handlers: [mipExtensionLoadSync()]
    },
    // mip页面组件
    {
        location: /^\/local-extension-loader/i,
        handlers: [mipExtensionLoad()]
    },

    // 配置了本地extension目录，则增加mip页面注入处理
    {
        location: function (path, config) {
            return !!path.match(config.mipPageExt);
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
