/**
 * @file 调试单个mip组件
 * @author mengke01(kekee000@gmail.com)
 */

const fs = require('fs');
const path = require('path');
const qs = require('querystring');
const extOptimizer = require('mip-extension-optimizer');
const cli = require('../../cli');
const boilerplate = require('../../boilerplate');
const injectLiveReload = require('../../util/inject-live-reload');

function getExtensionInfo(extensionPath) {
    const extension = new extOptimizer.Extension(extensionPath);
    return extension.info;
}

module.exports = function () {
    return function (context) {
        const extensionsDir = context.config.extensionsDir;
        const query = qs.parse(context.req._parsedUrl.query);
        if (!extensionsDir || !query.name || !query.name.match(/^mip-[\w-]+$/i)) {
            cli.error('can\'t get extensions');
            return;
        }

        var extensionPath = path.join(extensionsDir, query.name);
        if (!fs.existsSync(extensionPath)) {
            cli.error('can\'t find local extension', cli.chalk.green(query.name));
            return;
        }

        cli.info('debugging extension ', cli.chalk.green(query.name));

        var info = getExtensionInfo(extensionPath);
        var elements = [
            '/local-extension-loader?name=' + query.name
        ];
        var files = boilerplate.page({
            body: info.usage || ('<' + query.name + '></' + query.name + '>'),
            elements: elements
        });
        var html = files[0].content;
        // livereload配置
        if (context.config.livereload) {
            html = injectLiveReload(html);
        }

        context.res.header('content-type', 'text/html');
        context.res.send(html);
        context.end();
    };
};
