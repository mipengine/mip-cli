const fs = require('fs');
const path = require('path');
const cmdAddElement = require('../../lib/add-element');
const TMP_PATH = path.resolve(process.cwd(), 'test/tmp');
const assert = require('assert');
const del = require('del');

describe('add-element.js', function () {
    before(function () {
        fs.mkdirSync(TMP_PATH);
    });

    after(function() {
        del.sync(TMP_PATH);
    });

    // test case
    it('addelement', function (done) {
        cmdAddElement.exec({
            elementName: 'mip-test',
            baseDir: TMP_PATH
        });
        setTimeout(() => {
            assert.ok(fs.existsSync(path.resolve(TMP_PATH, 'mip-test')), 'mip-test directory');
            assert.ok(fs.existsSync(path.resolve(TMP_PATH, 'mip-test/mip-test.js')), 'mip-test.js');
            assert.ok(fs.existsSync(path.resolve(TMP_PATH, 'mip-test/mip-test.less')), 'mip-test.less');
            assert.ok(fs.existsSync(path.resolve(TMP_PATH, 'mip-test/README.md')), 'README.md');
            assert.ok(fs.existsSync(path.resolve(TMP_PATH, 'mip-test/package.json')), 'package.json');

            var content = fs.readFileSync(path.resolve(TMP_PATH, 'mip-test/package.json'), 'utf-8');
            assert.ok(content.indexOf('mip-test') > 0);
            done();
        }, 100);
    });

    // test case
    it('addelement -f', function (done) {
        cmdAddElement.exec({
            elementName: 'mip-test-force',
            baseDir: TMP_PATH
        });
        fs.writeFileSync(path.resolve(TMP_PATH, 'mip-test-force/package.json'), '');
        setTimeout(() => {
            cmdAddElement.exec({
                elementName: 'mip-test-force',
                baseDir: TMP_PATH,
                force: true
            });
            setTimeout(() => {
                const newContent = fs.readFileSync(path.resolve(TMP_PATH, 'mip-test-force/package.json'), 'utf-8');
                assert.ok(newContent.indexOf('mip-test-force') > 0, 'add force content');
                done()
            }, 100);
        }, 100);
    });

    it('addelement -c', function (done) {
        cmdAddElement.exec({
            elementName: 'mip-test-custom',
            custom: true,
            baseDir: TMP_PATH
        });
        setTimeout(() => {
            assert.ok(fs.existsSync(path.resolve(TMP_PATH, 'mip-test-custom')), 'mip-test directory');
            assert.ok(fs.existsSync(path.resolve(TMP_PATH, 'mip-test-custom/mip-test-custom.js')), 'mip-test-custom.js');
            assert.ok(fs.existsSync(path.resolve(TMP_PATH, 'mip-test-custom/mip-test-custom.less')), 'mip-test-custom.less');
            assert.ok(fs.existsSync(path.resolve(TMP_PATH, 'mip-test-custom/mip-test-custom.mustache')), 'mip-test-custom.mustache');
            assert.ok(fs.existsSync(path.resolve(TMP_PATH, 'mip-test-custom/mip-test-custom.json')), 'mip-test-custom.json');
            assert.ok(fs.existsSync(path.resolve(TMP_PATH, 'mip-test-custom/README.md')), 'README.md');
            assert.ok(fs.existsSync(path.resolve(TMP_PATH, 'mip-test-custom/package.json')), 'package.json');

            var content = fs.readFileSync(path.resolve(TMP_PATH, 'mip-test-custom/package.json'), 'utf-8');
            assert.ok(content.indexOf('mip-test-custom') > 0);
            done();
        }, 100);
    });
});
