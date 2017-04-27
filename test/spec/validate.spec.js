const fs = require('fs');
const path = require('path');
const cmdValidate = require('../../lib/validate');
const cli = require('../../lib/cli');
const TMP_PATH = path.resolve(process.cwd(), 'test/test-project');
const assert = require('assert');

describe('validate.js ', function () {
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
            files: ['mip.html'],
            baseDir: TMP_PATH
        });

        setTimeout(() => {
            assert.ok(cli.__logMessage.indexOf('validate success') >= 0, 'validate success');
            done();
        }, 10);

    });

    // test mip custom case
    it('validate custom success', function (done) {

        cmdValidate.exec({
            files: ['mip-custom.html'],
            custom: true,
            baseDir: TMP_PATH
        });

        setTimeout(() => {
            assert.ok(cli.__logMessage.indexOf('validate success') >= 0, 'validate success');
            done();
        }, 10);

    });

    // test case
    it('validate error', function (done) {

        cmdValidate.exec({
            files: ['validate.html'],
            baseDir: TMP_PATH
        });

        setTimeout(() => {
            assert.ok(cli.__logMessage.indexOf('validate error') >= 0, 'validate error');
            assert.ok(cli.__logMessage.match(/ERROR/g)[1], '>=2 errors');
            done();
        }, 10);

    });
});
