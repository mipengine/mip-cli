const fs = require('fs');
const path = require('path');
const cmdAdd = require('../../lib/add');
const TMP_PATH = path.resolve(process.cwd(), 'test/tmp');
const assert = require('assert');
const del = require('del');

describe('add.js ', function () {
    before(function () {
        fs.mkdirSync(TMP_PATH);
    });

    after(function() {
        del.sync(TMP_PATH);
    });

    // test case
    it('add', function (done) {
        const filePath = path.resolve(TMP_PATH, 'test.html');
        cmdAdd.exec({
            fileName: 'test.html',
            modules: ['mip-test-element'],
            baseDir: TMP_PATH
        });

        setTimeout(() => {
            assert.ok(fs.existsSync(filePath));
            const content = fs.readFileSync(filePath, 'utf-8');
            assert.ok(content.indexOf('mipcache.bdstatic.com') > 0);
            assert.ok(content.indexOf('mip-test-element') > 0);
            fs.writeFileSync(filePath, '');

            cmdAdd.exec({
                fileName: 'test.html',
                modules: ['mip-test-element'],
                baseDir: TMP_PATH
            });

            setTimeout(() => {
                const newContent = fs.readFileSync(filePath, 'utf-8');
                assert.ok(newContent.indexOf('mip-test-element') < 0);
                done()
            }, 100);
        }, 100);
    });


    // 测试组件平台引入
    it('add extensions from platform', function (done) {
        const filePath = path.resolve(TMP_PATH, 'platform.html');
        require('../../lib/util/config').set('mip-cli-extensions-map', {
            'mip-test-extension-platform': '1.0.1'
        });
        cmdAdd.exec({
            fileName: 'platform.html',
            modules: ['mip-test-extension-platform'],
            baseDir: TMP_PATH
        });

        setTimeout(() => {
            assert.ok(fs.existsSync(filePath));
            const content = fs.readFileSync(filePath, 'utf-8');
            assert.ok(content.indexOf('mipcache.bdstatic.com/extensions/platform') > 0);
            assert.ok(content.indexOf('mip-test-extension-platform') > 0);
            done();
        }, 100);
    });


    it('add -f', function (done) {
        const filePath = path.resolve(TMP_PATH, 'test-force.html');
        cmdAdd.exec({
            fileName: 'test-force.html',
            baseDir: TMP_PATH
        });

        setTimeout(() => {
            const content = fs.readFileSync(filePath, 'utf-8');
            assert.ok(content.indexOf('mip-test-element') < 0);
            cmdAdd.exec({
                fileName: 'test-force.html',
                modules: ['mip-test-element'],
                baseDir: TMP_PATH,
                force: true
            });
            setTimeout(() => {
                const newContent = fs.readFileSync(filePath, 'utf-8');
                assert.ok(newContent.indexOf('mip-test-element') > 0);
                done()
            }, 100);
        }, 100);
    });
});
