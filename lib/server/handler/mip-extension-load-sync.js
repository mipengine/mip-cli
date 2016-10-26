/**
 * @file 加载本地extension组件中的异步模块，
 *       有些组件依赖异步加载的脚本，这里需要做一下映射
 * @author mengke01(kekee000@gmail.com)
 */

const fs = require('fs');
const path = require('path');
const cli = require('../../cli');
const mimeTypes = require('../../util/mime-types');

module.exports = function () {

    return function (context) {
        const extensionsDir = context.config.extensionsDir;
        if (!extensionsDir || !context.req.path.match(/^\/(mip-[\-\w]+)\//)) {
            cli.error('can\'t get extension async content', context.req.path);
            return;
        }

        const extensionResPath = path.join(extensionsDir, context.req._parsedUrl.pathname);
        if (!fs.existsSync(extensionResPath)) {
            cli.error('can\'t find local extension res', cli.chalk.green(extensionResPath));
            return;
        }

        const html = fs.readFileSync(extensionResPath, 'utf8');
        const ext = path.extname(extensionResPath).slice(1);

        context.res.header('content-type', mimeTypes[ext] || 'application/octet-stream');
        context.res.send(html);
        context.end();
    };
};
