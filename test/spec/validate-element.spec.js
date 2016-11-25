const fs = require('fs');
const path = require('path');
const cmdValidate = require('../../lib/validate-element');
const cli = require('../../lib/cli');
const TMP_PATH = path.resolve(process.cwd(), 'test/test-project/');
const assert = require('assert');

describe('validate-element.js ', function () {
    beforeEach(function () {
        cli.__log = cli.log;
        // 代理log内容
        cli.log = function () {
            cli.__logMessage = cli.__logMessage || '';
            cli.__logMessage += Array.from(arguments).join('') + '\n';
        };
    });

    afterEach(function() {
        cli.log = cli.__log;
        delete cli.__logMessage;
        delete cli.__log;
    });

    // test case
    it('validate success', function (done) {

        cmdValidate.exec({
            file: './mip-test-element',
            baseDir: TMP_PATH
        });

        setTimeout(() => {
            assert.ok(cli.__logMessage.indexOf('validate success') >= 0, 'validate success');
            done();
        }, 100);

    });

    it('validate error', function (done) {

        cmdValidate.exec({
            file: './mip-test-preset/setting',
            baseDir: TMP_PATH
        });

        setTimeout(() => {
            assert.ok(cli.__logMessage.indexOf('validate error') >= 0, 'validate error');
            done();
        }, 100);

    });

});
