// Original code by Paul Tarau. Ported by CapelliC.

const e = require('./js/Engine')

const t = require('./js/Toks')
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
const trace = console.log
const tokenizer = new t.Toks()
trace(tokenizer.makeToks(add_pl_nl))
trace()
trace(tokenizer.toSentences(add_pl_nl))
