/**
 * @file 加载本地extension组件
 * @author mengke01(kekee000@gmail.com)
 */

const fs = require('fs');
const path = require('path');
const cli = require('../cli');
const qs = require('querystring');
const extOptimizer = require('mip-extension-optimizer');

function buildExtension(extensionPath) {
    var extension = new extOptimizer.Extension(extensionPath);
    return extension.build().then(function (files) {
        // 找到编辑完毕之后的mip组件内容
        var builded = files.find(function (file) {
            return file.path.match(/\.js$/);
        });
        return builded;
    });
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

        // 编译输出extension调试内容
        buildExtension(extensionPath).then(function (builded) {
            context.res.status(200);
            context.res.header('content-type', 'application/x-javascript');
            context.res.send(builded.data);
            context.end();
        }, function (e) {
            cli.error('build extention error', cli.chalk.green(query.name));
            cli.error(e);
            context.res.status(500);
            context.res.header('content-type', 'application/x-javascript');
            context.res.send('build extention error!');
            context.end();
        });
    };
};
