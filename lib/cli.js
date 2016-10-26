/**
 * @file cli 工具
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
/* eslint-disable no-console */
const program = require('commander');

module.exports = {
    program: program,
    chalk: require('chalk'),

    /**
     * 设置命令行项目解析
     *
     * @param  {Object} config 解析参数
     * @return {Array}  解析后的参数集合
     */
    setup: function (config) {
        if (config.usage) {
            program.arguments(config.usage);
        }

        if (config.options) {
            config.options.forEach(function (option) {
                program.option(option[0], option[1], option[2]);
            });
        }

        if (config.help) {
            program.on('--help', function () {
                console.log(config.help);
            });
        }

        program.parse(process.argv);
        // 只有命令，没有设置参数，打印help
        if (program.args.length === 0 && !config.noArgs) {
            return program.help();
        }

        return program.args || [];
    },

    /**
     * 打印日志
     *
     * @return {this}
     */
    log: function () {
        if (process.env.NODE_ENV !== 'test') {
            console.log.apply(null, arguments);
        }
        return this;
    },

    /**
     * 打印消息
     *
     * @return {this}
     */
    info: function () {
        const args = [this.chalk.cyan('INFO')].concat(Array.from(arguments));
        return this.log.apply(this, args);
    },

    /**
     * 打印警告
     *
     * @return {this}
     */
    warn: function () {
        const args = [this.chalk.yellow('WARN')].concat(Array.from(arguments));
        return this.log.apply(this, args);
    },

    /**
     * 打印错误
     *
     * @return {this}
     */
    error: function () {
        const args = [this.chalk.red('ERROR')].concat(Array.from(arguments));
        return this.log.apply(this, args);
    }
};
