const fs = require('fs');
const path = require('path');
const cmdValidate = require('../../lib/validate');
const cli = require('../../lib/cli');
const TMP_PATH = path.resolve(process.cwd(), 'test/tmp');
const assert = require('assert');

describe('validate.js ', function () {
    before(function () {
        fs.mkdirSync(TMP_PATH);
        cli.__log = cli.log;
        // 代理log内容
        cli.log = function () {
            cli.__logMessage = cli.__logMessage || '';
            cli.__logMessage += Array.from(arguments).join('') + '\n';
        };
    });

    after(function(done) {
        require('child_process').exec('rm -r ' + TMP_PATH,
        (err, stdout) => {
            if (err) {
                throw new Error('clean tmp path error!');
                return;
            }
            done();
        });
        cli.log = cli.__log;
        delete cli.__logMessage;
        delete cli.__log;
    });

    // test case
    it('validate', function (done) {
        const filePath = path.resolve(TMP_PATH, 'validate.html');
        const content = '<!DOCTYPE html><html mip><head></head>'
            + '<body></body>'
            + '</html>';
        fs.writeFileSync(filePath, content);

        cmdValidate.exec({
            files: ['validate.html'],
            baseDir: TMP_PATH
        });

        setTimeout(() => {
            assert.ok(cli.__logMessage, 'error exits');
            assert.ok(cli.__logMessage.match(/ERROR/g)[4], '5 errors');
            done();
        }, 20);

    });
});
