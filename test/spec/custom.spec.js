const fs = require('fs');
const path = require('path');
const custom = require('../../lib/mip-custom/custom-preview')
const TMP_PATH = path.resolve(process.cwd(), 'test/tmp');
const execSync = require('child_process').execSync;
const assert = require('assert');
const del = require('del');

describe('custom-compile.js', function () {
    before(function () {
        fs.mkdirSync(TMP_PATH);
    });

    after(function() {
        del.sync(TMP_PATH);
    });

    // test case
    it('mip custom', function (done) {
        var pth = path.resolve(__dirname, '../test-project/mip-test-custom');
        custom.exec({
            baseDir: pth,
            mipCustomData: "",
            mipCustomItems: [['template/mip-test-main']],
            mipCustomDir: pth,
            filePath:  path.resolve(pth, 'src', 'template'),
            data: null,
            dist: 'dist',
            tmp: 'tmp',
            type: 'preview'
        });
        setTimeout(function () {
            var dist = path.resolve(pth, 'dist');
            var map = path.resolve(pth, 'mip-conf.json');
            if (fs.existsSync(dist)) {
                execSync('rm -rf ' + dist);
                execSync('rm -rf ' + map);
                done();
            }
        }, 1000);
    });
});
