/**
 * @file mip 组件编译监控
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const exec = require('child_process').exec;
const events = require('events');
const cli = require('../cli');

function doCompileMip(mipDir) {
    mipDir = path.resolve(mipDir);
    return new Promise((resolve, reject) => {
        cli.info('compiling local mip main');
        exec('cd "' + mipDir + '" && npm run dev', (err, stdout) => {
            if (err) {
                cli.error('compiling local mip main failed', stdout);
                reject(err);
                return;
            }
            resolve(stdout);
        });
    });
}

let watcher = new events.EventEmitter();

/**
 * 启动mip项目监控
 *
 * @param  {string} mipDir mip主目录
 * @return {this}
 */
watcher.start = function (mipDir) {
    let srcDir = path.resolve(mipDir, 'src');
    if (!fs.existsSync(srcDir)) {
        throw new Error('mip dir not exists!');
    }

    // this.compiling 是否编译中，编译中的时候不进行refresh
    // this.pending 是否在等待中，在编译中时的文件改变会设置pending，编译完成后重新编译
    // 编译mip主模块
    const compile = () => {
        this.compiling = true;
        doCompileMip(mipDir).then(data => {
                if (this.pending) {
                    this.pending = false;
                    compile(mipDir);
                    return;
                }

                this.compiling = false;
                this.emit('change', {
                    message: data
                });
            }, e => {
                this.compile = this.pending = false;
                this.emit('error', e);
            });
    };
    const filterRefresh = filePath => {
        if (!filePath.match(/\.(?:js|less|es6)$/)) {
            return;
        }

        if (this.compiling) {
            this.pending = true;
            return;
        }
        compile();
    };

    this.watcher = chokidar.watch(srcDir, {
        ignoreInitial: true,
        ignored: [/\\.git\//, /\\.svn\//, /\\.hg\//],
        usePolling: false
    })
        .on('add', filterRefresh)
        .on('change', filterRefresh)
        .on('unlink', filterRefresh);
    return this;
};

/**
 * 结束mip项目监控
 */
watcher.stop = function () {
    this.watcher && this.watcher.stop();
    this.watcher = null;
};

module.exports = watcher;
