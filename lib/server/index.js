/**
 * @file express处理器，处理页面注入，脚本替换等
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
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
    for (let i = 0, l = handlers.length; i < l; i++) {
        if (typeof handlers[i].location === 'function' && handlers[i].location(path, config)) {
            return handlers[i].handlers;
        }
        else if (util.isRegExp(handlers[i].location) && handlers[i].location.test(path)) {
            return handlers[i].handlers;
        }
    }

    return [];
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
            const context = {
                name: Date.now(),
                req: req,
                res: res,
                isWait: false,
                isEnded: false,
                config: config,

                /**
                 * 标记执行完当前会话之后结束响应，不执行之后的filter
                 *
                 * @return {this}
                 */
                end: function () {
                    this.isEnded = true;
                    return this.start();
                },

                /**
                 * 停止当前会话
                 *
                 * @return {this}
                 */
                stop: function () {
                    this.isWait = true;
                    return this;
                },

                /**
                 * 重新开始当前会话
                 *
                 * @return {this}
                 */
                start: function () {
                    this.isWait = false;
                    nextHandler();
                    return this;
                }
            };

            let index = -1;
            nextHandler();
            function nextHandler() {
                if (context.isWait) {
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
        const curHandlers = filterHandlers(path, handlers, config);

        processHandlers(curHandlers, req, res)
            .then(function (context) {
                // 判断context是否结束，结束的context不进行下一步处理，请求响应结束
                // 未结束的context交由下一个express filter处理
                if (!context.isEnded) {
                    next();
                }
                else {
                    context.res.end();
                }
            });
    };
};
