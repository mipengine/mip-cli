/**
 * @file 调试单个mip组件
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
const fs = require('fs');
const path = require('path');
const extOptimizer = require('mip-extension-optimizer');
const cli = require('../../cli');
const boilerplate = require('../../boilerplate');
const mipUtil = require('../mip-util');

function getExtensionInfo(extensionPath) {
    const extension = new extOptimizer.Extension(extensionPath);
    return extension;
}

module.exports = function () {
    return function (context) {
        const extensionsDir = context.config.extensionsDir;
        const extensonName = context.req.path.match(/\/(mip-[\w-]+)$/)[1];
        if (!extensionsDir || !extensonName) {
            cli.error('can\'t get extensions');
            return;
        }


        const extensionPath = path.join(extensionsDir, extensonName);
        if (!fs.existsSync(extensionPath)) {
            cli.error('can\'t find local extension', cli.chalk.green(extensonName));
            return;
        }

        cli.info('debugging extension ', cli.chalk.green(extensonName));

        const extension = getExtensionInfo(extensionPath);
        const elements = [
            '/local-extension-loader/' + extensonName + '.js'
        ];

        // 注入 README.md 中的依赖脚本，先单独实现下
        // https://github.com/mipengine/mip-extension-optimizer/issues/4
        if (fs.existsSync(path.join(extensionPath, 'README.md'))) {
            const content = fs.readFileSync(path.join(extensionPath, 'README.md')).toString();
            const deps = (content.match(/所需脚本\s*\|\s*(.+?)[\r\n]/) || [])[1];

            // 只注入其他非当前组件的依赖
            deps.split(/\s*(?:,|<br\/?>)\s*/).forEach(function (url) {
                if (url.indexOf(extensonName + '.js') === -1) {
                    elements.push(url);
                }
            });
        }

        const examples = extension.info.examples
            || [
                {
                    title: '示例',
                    // description: '默认示例',
                    code: '<' + extensonName + '></' + extensonName + '>'
                }
            ];
        const files = boilerplate.page({
            // 预置内容
            preset: extension.setting ? (extension.setting['example.preset'] || '') : '',
            // 示例
            examples: examples,
            // 需要加载的元素集合
            elements: elements,
            title: extensonName + '_组件预览'
        });

        let html = files[0].content;
        // livereload配置
        if (context.config.livereload) {
            html = mipUtil.livereloadInject(html);
        }

        // 配置了mip目录，则增加mip注入
        if (context.config.mipDir) {
            html = require('../mip-util').mipmaiInject(html);
        }

        context.res.header('content-type', 'text/html');
        context.res.send(html);
        context.end();
    };
};
