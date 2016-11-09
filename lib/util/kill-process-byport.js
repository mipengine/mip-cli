/**
 * @file 根据端口号kill掉指定的node进程
 * @author mengke01(kekee000@gmail.com)
 */

const exec = require('child_process').exec;
const cli = require('../cli');

/**
 * 根据端口号kill掉占用端口的node进程，不包含当前进程，
 * 从`lsof -i tcp:port`列出的进程中筛选出符合条件的行，然后执行`kill`命令，
 * 返回值有以下几种：
 * false 没有找到相关进程，直接返回
 * -1 找到当前进程
 * pid 找到的pid，进行kill操作后返回
 *
 *
 * @param  {Object} options 参数配置
 * @param  {number} options.port node端口号
 * @param  {number=} options.timeout 检查进程退出超时时间，默认10秒
 * @return {Promise}
 */
module.exports = function (options) {
    // windows 平台获取不到进程调用信息，这里不做处理
    if (process.platform === 'win32') {
        return Promise.resolve(false);
    }

    options = Object.assign({}, options);

    if (!options.port) {
        throw new Error('port should not be null!');
    }
    const port = options.port;
    const timeout = options.timeout || 10000;
    const commandStr = 'lsof -i tcp:' + port + ' | grep node | cat';

    return new Promise((resolve, reject) => {
            exec(commandStr, (err, stdout) => {
                if (err) {
                    reject(err);
                    return;
                }

                const pid = +(stdout.trim().split(/\s+/)[1]);
                if (!pid) {
                    resolve(false);
                }
                else if (pid === process.pid) {
                    resolve(-1);
                }
                else {
                    exec('kill ' + pid, err => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        cli.log('kill', port, 'port process, pid', cli.chalk.yellow(pid));
                        resolve(pid);
                    });
                }
            });
        })
        // 检查所有进程都已经退出
        .then(pid => {
            if (pid <= 0) {
                return pid;
            }

            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                const checkExit = function () {
                    if (Date.now() - startTime > timeout) {
                        reject(new Error('check process exit timeout, pid: ' + pid));
                        return;
                    }

                    exec(commandStr, (err, stdout) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        // 检查是否还有剩余的pid没有退出
                        if (!stdout.trim()) {
                            resolve(pid);
                            return;
                        }
                        // 延迟检查
                        setTimeout(checkExit, 200);
                    });
                };
                checkExit();
            });
        });
};
