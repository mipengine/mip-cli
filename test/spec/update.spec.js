const fs = require('fs');
const path = require('path');
const cmdUpdate = require('../../lib/update');
const assert = require('assert');


function getConfigPath(name) {
    const home = process.env[
        require('os').platform() === 'win32'
            ? 'APPDATA'
            : 'HOME'
    ];
    return path.join(home, '.' + name + '.json');
}

describe('update.js ', function () {
    before(function (done) {
        this.timeout(100000);
        const request = require('request');
        request(
            {
                url: 'https://registry.npmjs.org/mip-cli-boilerplate/latest',
                timeout: 5000
            },
            (err, res, body) => {
                if (!err && res.statusCode === 200) {
                    done();
                }
                else {
                    throw new Error('request registry error test should be exit!');
                }
            }
        );
    });

    // test case
    it('update', function (done) {
        this.timeout(100000);
        var promise = cmdUpdate.exec(true);
        // update force
        promise.then((result) => {
            assert.ok(result === false || typeof result === 'object', 'result should be object or false');
            if (result) {
                const path = getConfigPath('mip-cli');
                assert.ok(fs.existsSync(path), 'should update config');
                assert.ok(result.local, 'should has local version');
                if (result.update) {
                    assert.ok(result.latest, 'should has latest version');
                }
            }
        }, () => {
            assert.ok(false, 'should not throw error!');
        });

        // update no force
        promise
            .then(() => {
                return cmdUpdate.exec();
            })
            .then((result) => {
                assert.ok(!result.update, 'result should be false');
                assert.ok(result.local, 'should have local version');
                done();
            }, () => {
                done();
                assert.ok(false, 'should not throw error!');
            });
    });


    it('update new version', function (done) {
        this.timeout(100000);
        const packagePath = path.resolve(__dirname, '../../node_modules/mip-cli-boilerplate/package.json');
        var package = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        package.version = '0.0.0';
        fs.writeFileSync(packagePath, JSON.stringify(package));
        delete require.cache[packagePath];

        cmdUpdate.exec(true).then((result) => {
            if (result) {
                assert.ok(result.latest, 'should have latest version');
                assert.ok(result.local, 'should have local version');
                var package = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
                assert.ok(package.version === result.latest, 'should update module to latest');
            }
            done()
        }, () => {
            done();
            assert.ok(false, 'should not throw error!');
        });
    })

});
