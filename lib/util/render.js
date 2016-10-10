/**
 * @file 模板渲染器引擎
 * @author mengke01(kekee000@gmail.com)
 */

const etpl = require('etpl');
const engine = new etpl.Engine({
    commandOpen: '{%',
    commandClose: '%}'
});

module.exports = {
    render: function (template, data) {
        var renderer = engine.compile(template);
        return renderer(data);
    }
};
