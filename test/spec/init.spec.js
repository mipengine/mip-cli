const fs = require('fs');
const path = require('path');
const cmdInit = require('../../lib/init');
const TMP_PATH = path.resolve(process.cwd(), 'test/tmp');
const assert = require('assert');
const del = require('del');
describe('init.js ', function () {
    before(function () {
        fs.mkdirSync(TMP_PATH);
    });

    after(function() {
        del.sync(TMP_PATH);
    });

    // test case
    it('init', function (done) {
        const filePath = path.resolve(TMP_PATH, 'mip.config');
        cmdInit.exec({
            baseDir: TMP_PATH
        });

        setTimeout(() => {
            assert.ok(fs.existsSync(filePath), 'exists');
            const content = fs.readFileSync(filePath, 'utf-8');
            assert.ok(content.indexOf('module.exports') > 0, 'content exists');
            fs.writeFileSync(filePath, '');

            cmdInit.exec({
                baseDir: TMP_PATH
            });

            setTimeout(() => {
                const newContent = fs.readFileSync(filePath, 'utf-8');
                assert.ok(newContent.indexOf('module.exports') < 0, 'content not exits');
                fs.unlinkSync(filePath);
                done()
            }, 100);
        }, 100);
    });


    it('init -f', function (done) {
        const filePath = path.resolve(TMP_PATH, 'mip.config');
        cmdInit.exec({
            baseDir: TMP_PATH
        });

        setTimeout(() => {
            fs.writeFileSync(filePath, '');

            cmdInit.exec({
                baseDir: TMP_PATH,
                force: true
            });

            setTimeout(() => {
                const newContent = fs.readFileSync(filePath, 'utf-8');
                assert.ok(newContent.indexOf('module.exports') > 0, 'content exists');
                done()
            }, 100);
        }, 100);
    });
});
