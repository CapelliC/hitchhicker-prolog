
/**
 * Reads chars from char streams using the current default encoding
 */

// Original code by Paul Tarau. Ported by CapelliC.

// RegExes set
const SPACE = '\\s+'
const ATOM  = '[a-z]\\w*'
const VAR   = '[A-Z]\\w*'
const LOC   = '_\\d{1,4}'
const NUM   = '\\d+'
const DOT   = '\\.'

const IF    = "if"
const AND   = "and"
const HOLDS = "holds"

const NIL   = "nil"
const LIST  = "list"
const LISTS = "lists"
const IS    = "is"  // ?

class Toks {

    makeToks(s) {

        // accepted sequences
        const e = new RegExp(`(${SPACE})|(${ATOM})|(${VAR})|(${LOC})|(${NUM})|(${DOT})`)

        function token(r) {

            if (r && r.index === 0) {

                // qualify atom as keyword
                function keyword(s) {
                    const k = [IF, AND, HOLDS, NIL, LIST, LISTS, IS].indexOf(s)
                    return {t: k < 0 ? ATOM : s, s: s}
                }
                function number(s) {
                    const n = parseInt(s)
                    return { t: NUM, s: s, n: n }
                }
                
                if (r[1]) return { t: SPACE, s: r[0] }
                if (r[2]) return keyword(r[0])
                if (r[3]) return { t: VAR, s: r[0] }
                if (r[4]) return { t: LOC, s: r[0] }
                if (r[5]) return number(r[0])
                if (r[6]) return { t: DOT, s: r[0] }
            }
        }
        var tokens = [], r
        while (r = token(e.exec(s))) {
            if (r.t !== SPACE)
                tokens.push(r)
            s = s.substring(r.s.length)
        }
        if (s.length)
            throw ` error at '${s}'`
        return tokens
    }

    /*
    const add_pl_nl = `
    add 0 X X .

    add _0 Y _1 and
      _0 holds s X and
      _1 holds s Z 
    if
      add X Y Z .

    goal R 
    if
      add _0 _1 R and
      _0 holds s _2 and
      _2 holds s 2345340 and
      _1 holds s _3 and
      _3 holds s 0 .

    `
    console.log(tokenize(add_pl_nl))
    */

/*
    makeToks(s, fromFile) {
        try {
            var T = new Toks(R)
            return T
        } catch(e) {
            e.printStackTrace()
            return null
        }
    }
*/
    toSentences(s) {
        var Wsss = []
        var Wss = []
        var Ws = []
        for (const t of this.makeToks(s))
            switch (t.t) {
            case DOT: {
                Wss.push(Ws)
                Wsss.push(Wss)
                Wss = []
                Ws = []
            }   break
            case IF: {
                Wss.push(Ws)
                Ws = []
            }   break
            case AND: {
                Wss.push(Ws)
                Ws = []
            }   break
            case HOLDS: {
                let w = Ws[0]
                Ws[0] = "h:" + w.substring(2)
            }   break
            case LISTS: {
                let w = Ws[0]
                Ws[0] = "l:" + w.substring(2)
            }   break
            case IS: {
                let w = Ws[0]
                Ws[0] = "f:" + w.substring(2)
            }   break
            default:
                Ws.push(t)
            }
        return Wsss
    }
}

exports.Toks = Toks
