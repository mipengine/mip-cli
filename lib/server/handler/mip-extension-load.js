/**
 * @file 加载本地extension组件
 * @author mengke01(kekee000@gmail.com)
 */

const fs = require('fs');
const path = require('path');
const cli = require('../../cli');
const extOptimizer = require('mip-extension-optimizer');

function buildExtension(extensonName, extensionPath) {
    const extension = new extOptimizer.Extension(extensionPath);
    const builder = extension.createBuilder({
        processors: extension.getDefaultBuildProcessors().slice(0, 4)
    });
    return builder.process().then(function () {
        // 找到编辑完毕之后的mip组件内容
        const jsFile = builder.getFile(extensonName + '/' + extensonName + '.js');
        return jsFile ? jsFile.getData() : '';
    });
}

function injectLocalJs (content) {
    let result;
    let reg = new RegExp('https://mipengine.baidu.com/', 'g');
    while ((result = reg.exec(content)) != null)  {
        if (result) {
            content = content.replace(result, '/mipcustom/');
        }
    }
    return content;
}

module.exports = function () {

    return function (context) {
        const extensionsDir = context.config.extensionsDir;
        const extensonName = context.req.path.match(/\/(mip-[\w-]+)\.js$/)[1];
        if (!extensionsDir || !extensonName) {
            cli.error('can\'t get extension');
            return;
        }

        const extensionPath = path.join(extensionsDir, extensonName);
        if (!fs.existsSync(extensionPath)) {
            cli.error('can\'t find local extension', cli.chalk.green(extensonName));
            return;
        }

        context.stop();
        // 编译输出extension调试内容
        const buildStartTime = Date.now();
        buildExtension(extensonName, extensionPath).then(function (html) {
            cli.info('build ', extensonName, 'cost',
                cli.chalk.green(Date.now() - buildStartTime),
                'ms');
            html = injectLocalJs(html);
            context.res.header('content-type', 'application/x-javascript');
            context.res.send(html);
            context.end();
        }, function (e) {
            cli.error('build extention error', cli.chalk.green(extensonName));
            cli.error(e);

            context.res.status(500);
            context.res.send('build extention error!');
            context.end();
        });
    };
};
