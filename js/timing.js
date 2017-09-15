const trace = console.log

exports.timing = function(s, f) {
    let t0 = Date.now()
    for (let k = 0; k < 50000000; ++k)
        f(k)
    let t1 = Date.now()
    trace(s, (t1 - t0).toLocaleString())
}

exports.trace = trace
