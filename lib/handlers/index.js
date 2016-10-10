/**
 * @file express处理器，处理页面注入，脚本替换等
 * @author mengke01(kekee000@gmail.com)
 */

const util = require('util');
const cli = require('../cli');

/**
 * 根据路径和配置查找合适的处理器
 *
 * @param  {string} path  当前请求路径
 * @param  {Array} handlers 处理器配置数组
 * @param  {Object} config  当前的项目配置
 * @return {Array}  找到的处理器
 */
function filterHandlers(path, handlers, config) {
    for (var i = 0, l = handlers.length; i < l; i++) {
        if (typeof handlers[i].location === 'function' && handlers[i].location(path, config)) {
            return handlers[i].handlers;
        }
        else if (util.isRegExp(handlers[i].location) && handlers[i].location.test(path)) {
            return handlers[i].handlers;
        }
    }

    throw new Error('can\'t find handlers to process request!');
}

/**
 * mip server 调试处理器
 *
 * @param  {Object} config 调试配置
 * @return {Function} express filter 函数
 */
module.exports = function (config) {

    const processHandlers = function (handlers, req, res) {
        return new Promise(function (resolve) {
            // init handler context
            var isWait = false;
            var context = {
                name: Date.now(),
                req: req,
                res: res,
                isEnded: false,
                config: config,
                end: function () {
                    res.end();
                    this.isEnded = true;
                },
                stop: function () {
                    isWait = true;
                },
                start: function () {
                    isWait = false;
                    nextHandler();
                }
            };

            var index = -1;
            nextHandler();
            function nextHandler() {
                if (isWait) {
                    return;
                }

                index++;
                if (index < handlers.length) {
                    try {
                        handlers[index](context);
                    }
                    catch (ex) {
                        cli.error(ex.message);
                    }
                    nextHandler();
                }
                else {
                    resolve(context);
                }
            }
        });
    };

    var handlers;
    // 组件调试handlers
    if (config.isExtensionsDir) {
        handlers = require('./support-mip-extensions');
    }
    // mip项目handlers
    else {
        handlers = require('./support-mip-project');
    }

    return function (req, res, next) {
        const path = req.path;
        processHandlers(filterHandlers(path, handlers, config), req, res)
            .then(function (context) {
                // 判断context是否结束，结束的context不进行下一步处理，请求响应结束
                // 未结束的context交由下一个express filter处理
                if (!context.isEnded) {
                    next();
                }
            });
    };
};
