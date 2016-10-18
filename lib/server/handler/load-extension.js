/**
 * @file 加载本地extension组件
 * @author mengke01(kekee000@gmail.com)
 */

const fs = require('fs');
const path = require('path');
const cli = require('../../cli');
const string = require('../../util/string');
const qs = require('querystring');
const extOptimizer = require('mip-extension-optimizer');

function buildExtension(extensonName, extensionPath) {
    const extension = new extOptimizer.Extension(extensionPath);
    const builder = extension.createBuilder({});
    return builder.process().then(function () {
        // 找到编辑完毕之后的mip组件内容
        var jsFile = builder.getFile(extensonName + '/' + extensonName + '.js');
        var html = '';

        // 打包主js文件
        if (jsFile) {
            html += jsFile.getData();
        }
        return html;
    });
}

module.exports = function () {

    return function (context) {
        const extensionsDir = context.config.extensionsDir;
        const query = qs.parse(context.req._parsedUrl.query);
        const extensonName = query.name;
        if (!extensionsDir || !extensonName || !extensonName.match(/^mip-[\w-]+$/i)) {
            cli.error('can\'t get extensions');
            return;
        }

        const extensionPath = path.join(extensionsDir, extensonName);
        if (!fs.existsSync(extensionPath)) {
            cli.error('can\'t find local extension', cli.chalk.green(extensonName));
            return;
        }

        // 编译输出extension调试内容
        buildExtension(extensonName, extensionPath).then(function (html) {
            context.res.status(200);
            context.res.header('content-type', 'application/x-javascript');
            context.res.send(html);
            context.end();
        }, function (e) {
            cli.error('build extention error', cli.chalk.green(extensonName));
            cli.error(e);
            context.res.status(500);
            context.res.header('content-type', 'application/x-javascript');
            context.res.send('build extention error!');
            context.end();
        });
    };
};
