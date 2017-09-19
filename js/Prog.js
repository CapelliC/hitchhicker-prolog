// Original code by Paul Tarau. Ported by CapelliC.

const Engine = require('./Engine')
const IntList = require('./IntList')

const pp = console.log

class Prog /*extends Engine*/ {

  constructor() {
    //super()
  }

  showTerm(O) {
  }

  static maybeNull(O) {
  }

  static isListCons(name) {
    return "."===name || "[|]"===name || "list"===name
  }

  static isOp(name) {
    return "/"===name || "-"===name || "+"===name || "="===name
  }

  static st0(args) {
    let buf = ''
    return buf
  }

  ppCode() {
    pp("\nSYMS:")
    pp(this.syms)
    pp("\nCLAUSES:\n")

    for (let i = 0; i < clauses.length; i++) {
      let C = this.clauses[i]
      pp("[" + i + "]:" + this.showClause(C))
    }
    pp("")
  }

  showClause(s) {
    let buf = ''
    return buf
  }

  ppGoals(bs) {
    while (!IntList.isEmpty(bs)) {
      pp(this.showTerm(IntList.head(bs)))
      bs = IntList.tail(bs)
    }
  }

  ppc(S) {
    //stats();
    let bs = S.gs
    pp("\nppc: t=" + S.ttop + ",k=" + S.k + "len=" + IntList.len(bs))
    this.ppGoals(bs)
  }

  /////////////// end of show

}

exports.Prog = Prog
