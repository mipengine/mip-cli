/**
 * @file 调试单个mip组件
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
const fs = require('fs');
const path = require('path');
const qs = require('querystring');
const extOptimizer = require('mip-extension-optimizer');
const cli = require('../../cli');
const boilerplate = require('../../boilerplate');
const injectLiveReload = require('../../util/inject-live-reload');

function getExtensionInfo(extensionPath) {
    const extension = new extOptimizer.Extension(extensionPath);
    return extension;
}

module.exports = function () {
    return function (context) {
        const extensionsDir = context.config.extensionsDir;
        const query = qs.parse(context.req._parsedUrl.query);
        if (!extensionsDir || !query.name || !query.name.match(/^mip-[\w-]+$/i)) {
            cli.error('can\'t get extensions');
            return;
        }

        const extensionPath = path.join(extensionsDir, query.name);
        if (!fs.existsSync(extensionPath)) {
            cli.error('can\'t find local extension', cli.chalk.green(query.name));
            return;
        }

        cli.info('debugging extension ', cli.chalk.green(query.name));

        const extension = getExtensionInfo(extensionPath);
        const elements = [
            '/local-extension-loader?name=' + query.name
        ];
        const examples = extension.info.examples
            || [
                {
                    title: '示例',
                    // description: '默认示例',
                    code: '<' + query.name + '></' + query.name + '>'
                }
            ];
        const files = boilerplate.page({
            // 预置内容
            preset: extension.setting ? (extension.setting['example.preset'] || '') : '',
            // 示例
            examples: examples,
            // 需要加载的元素集合
            elements: elements
        });

        let html = files[0].content;
        // livereload配置
        if (context.config.livereload) {
            html = injectLiveReload(html);
        }

        context.res.header('content-type', 'text/html');
        context.res.send(html);
        context.end();
    };
};
