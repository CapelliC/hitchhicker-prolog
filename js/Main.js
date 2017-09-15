//import Clause from './Clause' //./Prog'
//import './Engine'
const Clause = require('./Clause.js')
const Engine = require('./Engine.js')

function run(fname0) {

    const pp = console.log
    
    fname = fname0 + ".nl"
    const code = fs.readFileSync(fname)
    
    let P
    if (false) {
      P = new Prog(code)
      pp("CODE")
      P.ppCode()
    } else {
      P = new Engine(fname)
    }

    pp("RUNNING")
    const t1 = Date.Now
    P.run()
    pp("time in msec=", (Date.Now() - t1).toLocaleString())
}

function main() {
    var path = "/home/carlo/test/java/prologEngine/progs/", fname
    if (arguments.length == 0)
        fname = path + "perms.pl"
    else
        fname = path + arguments[0]
    run(fname)
}
