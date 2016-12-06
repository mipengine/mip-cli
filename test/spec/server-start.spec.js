const fs = require('fs');
const path = require('path');
const request = require('supertest');
const assert = require('assert');

const cmdServer = require('../../lib/server-start');
const TMP_PATH = path.resolve(process.cwd(), 'test/test-project');

describe('server-start.js ', function () {
    before(function (done) {
        cmdServer.exec({
            baseDir: TMP_PATH,
            mipPageExt: /\.(?:html|htm|mip)$/i,
            port: 12456,
            isExtensionsDir: false,
            extensionsDir: TMP_PATH,
            livereload: false
        });
        setTimeout(done, 100);
    });

    const HOST = 'http://127.0.0.1:12456';

    // test case
    it('request root directory', function (done) {
        const req = request(HOST);
        req.get('/')
            .expect('Content-Type', /html/)
            .expect(200)
            .expect(/mip-test-element/)
            .expect(/mip\.html/)
            .end((err, res) => {
                assert(!err, 'project root directory list error');
                done();
            });
    });

    it('request mip.html', function (done) {
        const req = request(HOST);
        req.get('/mip.html')
            .expect('Content-Type', /html/)
            .expect(200)
            .expect(/mipcache\.bdstatic\.com/)
            .expect(/name="viewport"/)
            .end((err, res) => {
                assert(!err, 'project mip.html error');
                done();
            });
    });

    it('request mip-test-element directory', function (done) {
        const req = request(HOST);
        req.get('/mip-test-element')
            .expect('Content-Type', /html/)
            .expect(200)
            .expect(/README\.md/)
            .expect(/package\.json/)
            .end((err, res) => {
                //console.log(err)
                assert(!err, 'project mip-test-element directory list error');
                done();
            });
    });

    it('request mip-test-element extension', function (done) {
        const req = request(HOST);
        req.get('/local-extension-loader/mip-test-element.js')
            .expect(200)
            .expect(/define/)
            .expect(/mip-test-element/)
            .expect(/\["mip-test-element\"\]/)
            .end((err, res) => {
                console.log(err)
                assert(!err, 'extension mip-test-element load error');
                done();
            });
    });

    it('request 404', function (done) {
        const req = request(HOST);
        req.get('/mip-test-element1')
            .expect(404, done);
    });
});

describe('server-start.js extensions', function () {
    before(function (done) {
        //this.timeout(100000)
        cmdServer.exec({
            baseDir: TMP_PATH,
            mipPageExt: /\.(?:html|htm|mip)$/i,
            port: 12457,
            isExtensionsDir: true,
            extensionsDir: TMP_PATH,
            livereload: false
        });
        setTimeout(done, 100);
    });

    const HOST = 'http://127.0.0.1:12457';

    it('request extension root', function (done) {
        const req = request(HOST);
        req.get('/')
            .expect(200)
            .expect(/mip-test-element/)
            .expect(/mip-test-preset/)
            .expect(/mip\s+extensions\s+list/)
            .end((err, res) => {
                assert(!err, 'extensions root list error');
                done();
            });
    });

    it('request mip-test-element extension preset', function (done) {
        const req = request(HOST);
        req.get('/local-extension-debug/mip-test-preset')
            .expect(200)
            .expect(/mip-test-preset/)
            .expect(/local-extension-loader/)
            .expect(/example\.preset/)
            .end((err, res) => {
                assert(!err, 'extension mip-test-preset load error');
                done();
            });
    });
});


describe('server-start.js mipmain', function () {
    before(function (done) {
        //this.timeout(100000)
        cmdServer.exec({
            baseDir: path.resolve(process.cwd(), 'test/test-mipmain'),
            mipPageExt: /\.(?:html|htm|mip)$/i,
            port: 12458,
            isExtensionsDir: false,
            mipDir: path.resolve(process.cwd(), '../mip'),
            livereload: false
        });
        setTimeout(done, 100);
    });

    const HOST = 'http://127.0.0.1:12458';

    it('request mipmain index.html', function (done) {
        const req = request(HOST);
        req.get('/index.html')
            .expect(200)
            .expect(/\/miplocal\/dist\/mip\.css/)
            .expect(/\/miplocal\/dist\/mip\.js/)
            .end((err, res) => {
                assert(!err, 'mip main inject error');
                done();
            });
    });
});

