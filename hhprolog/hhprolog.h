#ifndef HHPROLOG_H
#define HHPROLOG_H

#include <string>
#include <vector>
#include <array>
// or #include <set>
#include <regex>
#include <iostream>

namespace hhprolog {

using namespace std;
typedef const string cstr;
typedef vector<int> IntList;
typedef vector<int> intS;
typedef vector<int> IntStack;
template <class T> struct ObStack : vector<T>{};

typedef vector<cstr> Ts;
typedef vector<vector<cstr>> Tss;
typedef vector<vector<vector<cstr>>> Tsss;
inline cstr operator+(cstr s, int i) { return s + to_string(i); }

struct Term {
    enum { t_int, t_atom, t_var, t_struct } type;

    Term(int i) : type(t_int), i(i) {}
    Term(cstr s) : type(t_atom), s(s) {}
    Term(cstr s, int i) : type(t_var), i(i), s(s) {}
    Term(cstr f, vector<Term> args) : type(t_struct), s(f), args(args) {}

    int i;
    cstr s;
    vector<Term> args;

    string toString() const {
        switch(type) {
        case t_int:
            return to_string(i);
        case t_atom:
            return s;
        case t_var:
            return s;
        case t_struct: {
            string j;
            return s + "(" + transform(args.begin(), args.end(), j) + ")";
        }
    }
}

void pp(string s) {
    cout << s << endl;
}

cstr
    SPACE = "\\s+",
    ATOM  = "[a-z]\\w*",
    VAR   = "[A-Z_]\\w*",
    NUM   = "-?\\d+",
    DOT   = "\\.";

// atom keywords
cstr
    IF    = "if",
    AND   = "and",
    HOLDS = "holds",
    NIL   = "nil",
    LISTS = "lists",
    IS    = "is";  // ?

class Toks {

    struct tok {
        cstr t; cstr s; int n;
    };
    vector<tok> makeToks(cstr s) {
        auto e = regex("(${SPACE})|(${ATOM})|(${VAR})|(${NUM})|(${DOT})");
        auto token = [](smatch r) {
            if (!r.empty()) {
                auto tkAtom = [](cstr s) {
                    array<cstr, 6> kws = {IF, AND, HOLDS, NIL, LISTS, IS};
                    auto p = find(kws.cbegin(), kws.cend(), s);
                    return tok{p == kws.cend() ? ATOM : s, s, 0};
                };
                auto tkVar = [](cstr s) {
                    return tok{VAR, s, 0};
                };
                auto tkNum = [](cstr s) {
                    return tok{NUM, s, stoi(s)};
                };

                if (r[1].str().size()) return tok{SPACE, r[0], 0};
                if (r[2].str().size()) return tkAtom(r.str());
                if (r[3].str().size()) return tkVar(r[0]);
                if (r[4].str().size()) return tkNum(r[0]);
                if (r[5].str().size()) return tok{DOT, r[0], 0};
            }
            throw "no match";
        };
        vector<tok> tokens;
        sregex_iterator f(s.cbegin(), s.cend(), e), l = sregex_iterator();
        while (f != l) {
            auto r = token(*f++);
            if (r.t != SPACE)
                tokens.push_back(r);
        }
        return tokens;
    }

public:
  Tsss toSentences(cstr s) {
    Tsss Wsss;
    Tss Wss;
    Ts Ws;
    for (auto t : makeToks(s)) {
      if (t.t == DOT) {
        Wss.push_back(Ws);
        Wsss.push_back(Wss);
        Wss.clear();
        Ws.clear();
        continue;
      }
      if (t.t == IF) {
        Wss.push_back(Ws);
        Ws.clear();
        continue;
      }
      if (t.t == AND) {
        Wss.push_back(Ws);
        Ws.clear();
        continue;
      }
      if (t.t == HOLDS) {
        Ws[0] = "h:" + Ws[0].substr(2);
        continue;
      }
      if (t.t == LISTS) {
        Ws[0] = "l:" + Ws[0].substr(2);
        continue;
      }
      if (t.t == IS) {
        Ws[0] = "f:" + Ws[0].substr(2);
        continue;
      }
      if (t.t == VAR) {
        Ws.push_back("v:" + t.s);
        continue;
      }
      if (t.t == NUM) {
        Ws.push_back((t.n < (1 << 28) ? "n:" : "c:") + t.s);
        continue;
      }
      if (t.t == ATOM || t.t == NIL) {
        Ws.push_back("c:" + t.s);
        continue;
      }
       throw "unknown token:"+t.t;
    }
    return Wsss;
  }
};

struct Clause {
    int len;
    intS hgs;
    int base;
    int neck;
    intS xs;
};
struct Spine {
    int hd; // head of the clause to which this corresponds
    int base; // top of the heap when this was created

    IntList gs; // goals - with the top one ready to unfold
    int ttop; // top of the trail when this was created

    int k;
    intS xs; // index elements
    intS cs; // array of  clauses known to be unifiable with top goal in gs

    Spine(intS gs0, int base, IntList gs, int ttop, int k, intS cs) :
        hd(gs0[0]),
        base(base),
        gs(gs0), //   : gs0.concat(gs).slice(1),
        ttop(ttop),
        k(k),
        cs(cs)
    {
    }

    Spine(int hd, int ttop) :
        hd(hd),
        base(0),
        ttop(ttop),
        k(-1)
    {
    }
};

const int MINSIZE = 1 << 15;
const int MAXIND = 3;
const int START_INDEX = 20;

const int V = 0;
const int U = 1;
const int R = 2;
const int C = 3;
const int N = 4;
const int A = 5;
const int BAD = 7;

inline int tag(int t, int w) { return -((w << 3) + t); }
inline int detag(int w) { return -w >> 3; }
inline int tagOf(int w) { return -w & 7; }
inline bool isVAR(int x) { return tagOf(x) < 2; }
cstr tagSym(int t) {
  if (t == V) return "V";
  if (t == U) return "U";
  if (t == R) return "R";
  if (t == C) return "C";
  if (t == N) return "N";
  if (t == A) return "A";
  return "?";
}
cstr heapCell(int w) {
    return tagSym(tagOf(w))+":"+detag(w)+"["+w+"]";
}
intS toNums(vector<Clause> clauses) {
    intS r(clauses.size());
    iota(r.begin(), r.end(), 0);
    return r;
}

class Engine {

protected:
    vector<cstr> syms;
    vector<Clause> clauses;
    intS cls;
    intS heap;
    int top;
    IntStack trail;
    IntStack ustack;
    ObStack<Spine> spines;

    Spine *query;

    //IMap<Integer>[] imaps;
    //IntMap[] vmaps;

public:
    Engine(cstr asm_nl_source) {
        makeHeap(50);
        clauses = dload(asm_nl_source);
        cls = toNums(clauses);
        query = init();
        //vmaps = vcreate(MAXIND);
        //imaps = index(clauses, vmaps);
    }
    int addSym(cstr sym) {
        auto I = syms.indexOf(sym);
        if (I == -1) {
            I = syms.size();
            syms.push(sym);
        }
        return I;
    }
    cstr getSym(int w) {
        if (w < 0 || w >= syms.size())
            throw cstr("BADSYMREF=") + w;
        return syms[w];
    }
    void makeHeap(int size = MINSIZE) {
        heap.resize(size);
        clear();
    }
    void clear() {
        for (int i = 0; i <= top; i++)
            heap[i] = 0;
        top = -1;
    }
    void push(int i) {
        heap[++top] = i;
    }
    int size() {
        return top + 1;
    }
    void expand() {
        heap.resize(heap.size() * 2);
    }
    void ensureSize(int more) {
        if (1 + top + more >= heap.size())
            expand();
    }
    vector<Clause> dload(cstr s) {
        auto Wsss = Toks().toSentences(s);
        vector<Clause> Cs;
        for (auto Wss: Wsss) {
            vector<vector<int>> refs;
            vector<Clause> cs;
            intS gs;
            auto Rss = mapExpand(Wss);
            int k = 0;
            for (auto ws: Rss) {
                int l = ws.size();
                gs.push_back(tag(R, k++));
                cs.push_back(tag(A, l));
                for (auto w: ws) {
                    if (1 == w.length)
                        w = "c:" + w
                                auto L = w.substr(2);
                    switch (w[0]) {
                    case 'c':
                        cs.push_back(encode(C, L));
                        k++;
                        break;
                    case 'n':
                        cs.push_back(encode(N, L))
                                k++;
                        break;
                    case 'v':
                        if (refs[L] === undefined)
                            refs[L] = []
                                    refs[L].push_back(k);
                        cs.push_back(tag(BAD, k));
                        k++;
                        break;
                    case 'h':
                        if (refs[L] === undefined)
                            refs[L] = []
                                    refs[L].push(k - 1)
                                    cs[k - 1] = tag(A, l - 1)
                                    gs.pop()
                                    break
                            default:
                                    throw "FORGOTTEN=" + w
                    }
                }
            }

            for (auto kIs: refs) {
                auto Is = refs[kIs];
                int leader = -1;
                for (auto j: Is)
                    if (A == tagOf(cs[j])) {
                        leader = j;
                        break;
                    }
                if (-1 == leader) {
                    leader = Is[0];
                    for (auto i: Is)
                        if (i == leader)
                            cs[i] = tag(V, i);
                        else
                            cs[i] = tag(U, leader);
                } else
                    for (auto i: Is) {
                        if (i == leader)
                            continue;
                        cs[i] = tag(R, leader);
                    }
            }
            auto neck = 1 == gs.size() ? cs.size() : detag(gs[1]);
            auto tgs = gs;
            Cs.push_back(putClause(cs, tgs, neck));
        }
        return Cs;
    }
    int getRef(int x) { return heap[detag(x)]; }
    void setRef(int w, int r) { heap[detag(w)] = r; }
    int encode(int t, cstr s) {
        size_t p = 0;
        int w = stoi(s, &p);
        if (w < s.size()) {
            if (C == t)
                w = addSym(s);
            else
                throw cstr("bad in encode=") + t + ":" + s;
        }
        return tag(t, w);
    }
    void unwindTrail(int savedTop) {
        while (savedTop < trail.size() - 1) {
            int href = trail[trail.size() - 1];
            trail.pop_back();
            setRef(href, href);
        }
    }
    int deref(int x) {
        while (isVAR(x)) {
            auto r = getRef(x);
            if (r == x)
                break;
            x = r;
        }
        return x;
    }
    cstr showTerm(Term x) {
        return x.toString();
    }
    void ppTrail() {
        for (int i = 0; i <= trail[trail.size()-1]; i++) {
            int t = trail[i];
            pp(cstr("trail[") + i + "]=" + showCell(t) + ":" + showTerm(t));
        }
    }
    Term exportTerm(int x) {
    x = deref(x);
    int t = tagOf(x);
    int w = detag(x);
    switch (t) {
    case C:
      return getSym(w);
    case N:
        return w;
    case V:
    //case U:
      res = "V" + w;
        break;
    case R: {
      int a = heap[w];
      if (A != tagOf(a))
        throw cstr("*** should be A, found=") + showCell(a);
      int n = detag(a);
      intS arr(n);
      int k = w + 1;
      for (int i = 0; i < n; i++) {
        int j = k + i;
        arr[i] = exportTerm(heap[j]);
      }
      res = arr;
    } break;
    default:
      throw cstr("*BAD TERM*") + showCell(x);
    }
    return res;
  }
  cstr showCell(int w) {
    var t = tagOf(w)
    var val = detag(w)
    var s = null
    switch (t) {
    case V:
      s = "v:" + val
      break
    case U:
      s = "u:" + val
      break
    case N:
      s = "n:" + val
      break
    case C:
      s = "c:" + this.getSym(val)
      break
    case R:
      s = "r:" + val
      break
    case A:
      s = "a:" + val
      break
    default:
      s = "*BAD*=" + w
    }
    return s
  }
  showCells2(base, len) {
    var buf = ''
    for (var k = 0; k < len; k++) {
      var instr = this.heap[base + k]
      buf += "[" + (base + k) + "]" + this.showCell(instr) + " "
    }
    return buf
  }
  showCells1(cs) {
    var buf = ''
    for (var k = 0; k < cs.length; k++)
      buf += "[" + k + "]" + this.showCell(cs[k]) + " "
    return buf
  }

  ppc(C) {}
  ppGoals(gs) {}
  ppSpines() {}

  unify(base) {
    while (this.ustack.length) {
      var x1 = this.deref(this.ustack.pop())
      var x2 = this.deref(this.ustack.pop())
      if (x1 != x2) {
        var t1 = tagOf(x1)
        var t2 = tagOf(x2)
        var w1 = detag(x1)
        var w2 = detag(x2)
        if (isVAR(x1)) {
          if (isVAR(x2) && w2 > w1) {
            this.heap[w2] = x1
            if (w2 <= base)
              this.trail.push(x2)
          } else {
            this.heap[w1] = x2
            if (w1 <= base)
              this.trail.push(x1)
          }
        } else if (isVAR(x2)) {
          this.heap[w2] = x1
          if (w2 <= base)
            this.trail.push(x2)
        } else if (R == t1 && R == t2) {
          if (!this.unify_args(w1, w2))
            return false
        } else
          return false
      }
    }
    return true
  }

  unify_args(w1, w2) {
    var v1 = this.heap[w1]
    var v2 = this.heap[w2]
    // both should be A
    var n1 = detag(v1)
    var n2 = detag(v2)
    if (n1 != n2)
      return false
    var b1 = 1 + w1
    var b2 = 1 + w2
    for (var i = n1 - 1; i >= 0; i--) {
      var i1 = b1 + i
      var i2 = b2 + i
      var u1 = this.heap[i1]
      var u2 = this.heap[i2]
      if (u1 == u2)
        continue
      this.ustack.push(u2)
      this.ustack.push(u1)
    }
    return true
  }
  putClause(cs, gs, neck) {
    var base = this.size()
    var b = tag(V, base)
    var len = cs.length
    this.pushCells2(b, 0, len, cs)
    for (var i = 0; i < gs.length; i++)
      gs[i] = relocate(b, gs[i])
    var xs = this.getIndexables(gs[0])
    return Clause(len, gs, base, neck, xs)
  }
  void pushCells(int b, int from, int to, int base) {
    ensureSize(to - from);
    for (int i = from; i < to; i++)
        push(relocate(b, this.heap[base + i]));
  }
  void pushCells2(int b, int from, int to, intS &cs) {
    ensureSize(to - from);
    for (int i = from; i < to; i++)
        push(relocate(b, cs[i]));
  }
  int pushHead(int b, const Clause& C) {
    pushCells1(b, 0, C.neck, C.base);
    return relocate(b, C.hgs[0]);
  }
  intS pushBody(int b, int head, Clause& C) {
    pushCells1(b, C.neck, C.len, C.base);
    int l = C.hgs.size();
    intS gs(l);
    gs[0] = head;
    for (int k = 1; k < l; k++) {
      int cell = C.hgs[k];
      gs[k] = relocate(b, cell);
    }
    return gs;
  }
  void makeIndexArgs(Spine& G) {
    int goal = G.gs[0];
    if (G.xs.size())
      return;
    int p = 1 + detag(goal);
    int n = Math.min(MAXIND, detag(getRef(goal)));

    intS xs(MAXIND);
    for (int i = 0; i < n; i++) {
      int cell = deref(heap[p + i]);
      xs[i] = cell2index(cell);
    }
    G.xs = xs;
    if (imaps) throw "IMap TBD";
  }

  intS getIndexables(int ref) {
    int p = 1 + detag(ref);
    int n = detag(getRef(ref));
    intS xs = intS(MAXIND);
    for (int i = 0; i < MAXIND && i < n; i++) {
      int cell = deref(heap[p + i]);
      xs[i] = cell2index(cell);
    }
    return xs;
  }
  int cell2index(int cell) {
    int x = 0;
    int t = tagOf(cell);
    switch (t) {
    case R:
      x = getRef(cell);
        break;
    case C:
    case N:
      x = cell;
        break;
    }
    return x;
  }
  bool match(xs, C0) {
    for (int i = 0; i < MAXIND; i++) {
      int x = xs[i];
      int y = C0.xs[i];
      if (0 == x || 0 == y)
        continue;
      if (x != y)
        return false;
    }
    return true;
  }
  Spine unfold(const Spine& G) {
    int ttop = trail.size() - 1;
    int htop = top;
    int base = htop + 1;

    makeIndexArgs(G);

    int last = G.cs.size();
    for (int k = G.k; k < last; k++) {
      const Clause& C0 = clauses[G.cs[k]];
      if (!match(G.xs, C0))
        continue;
      int base0 = base - C0.base;
      int b = tag(V, base0);
      int head = pushHead(b, C0);
      ustack.clear();
      ustack.push_back(head);
      ustack.push_back(G.gs[0]);
      if (!unify(base)) {
        unwindTrail(ttop);
        top = htop;
        continue;
      }
      intS gs = pushBody(b, head, C0);
      IntList newgs = gs.concat(G.gs.slice(1)).slice(1);
      G.k = k + 1;
      if (newgs.length)
        return Spine(gs, base, G.gs.slice(1), ttop, 0, this.cls);
      else
        return answer(ttop);
    }
    return null;
  }
  getQuery() { return array_last(this.clauses, null) }
  Clause* init() {
    int base = size();
    var G = this.getQuery()
    var Q = Spine6(G.hgs, base, [], array_last(this.trail, -1), 0, this.cls)
    this.spines.push(Q)
    return Q
  }
  answer(ttop) { return Spine2(this.spines[0].hd, ttop) }
  popSpine() {
    var G = this.spines.pop()
    this.unwindTrail(G.ttop)
    this.top = G.base - 1
  }
  yield_() {
    while (this.spines.length) {
      var G = array_last(this.spines, null)
      var C = this.unfold(G)
      if (null == C) {
        this.popSpine() // no matches
        continue
      }
      if (hasGoals(C)) {
        this.spines.push(C)
        continue
      }
      return C // answer
    }
    return null
  }
  heap2s() { return '[' + this.top + ' ' + this.heap.slice(0,this.top).map((x,y) => heapCell(x)).join(',') + ']' }
  ask() {
    this.query = this.yield_()
    if (null == this.query)
      return null
    var res = this.answer(this.query.ttop).hd
    var R = this.exportTerm(res)
    this.unwindTrail(this.query.ttop)
    return R
  }
  run(print_ans) {
    var ctr = 0
    for (;; ctr++) {
      var A = this.ask()
      if (null == A)
        break
      if (print_ans)
        pp("[" + ctr + "] " + "*** ANSWER=" + this.showTerm(A))
    }
    pp("TOTAL ANSWERS=" + ctr)
  }
  vcreate(l) {
    var vss = []
    for (var i = 0; i < l; i++)
      vss.push([])
    return vss
  }
  put(imaps, vss, keys, val) {
    for (var i = 0; i < imaps.length; i++) {
      var key = keys[i]
      if (key != 0)
        imaps[i][key] = val
      else
        vss[i].add(val)
    }
  }
  index(clauses, vmaps) {
    if (clauses.length < START_INDEX)
      return null
    var T = JSON.stringify
    var imaps = Array(vmaps.length)
    for (var i = 0; i < clauses.length; i++) {
      var c = clauses[i]
      pp("!!!xs=" + T(c.xs) + ":" + this.showCells1(c.xs) + "=>" + i)
      this.put(imaps, vmaps, c.xs, i + 1) // $$$ UGLY INC
      pp(T(imaps))
    }
    pp("INDEX")
    pp(T(imaps))
    pp(T(vmaps))
    pp("")
    return imaps
  }
};

Tss maybeExpand(Ts Ws) {
  auto W = Ws[0];
  if (W.size() < 2 || "l:" != W.substr(0, 2))
    return Tss();
  int l = Ws.size();
  Tss Rss;
  auto V = W.substr(2);
  for (int i = 1; i < l; i++) {
    cstr Vi = 1 == i ? V : V + "__" + (i - 1);
    cstr Vii = V + "__" + i;
    vector<cstr> Rs = {"h:" + Vi, "c:list", Ws[i], i == l - 1 ? "c:nil" : "v:" + Vii};
    Rss.push_back(Rs);
  }
  return Rss;
}
Tss mapExpand(Tss Wss) {
  Tss Rss;
  for (auto Ws: Wss) {
    auto Hss = maybeExpand(Ws);
    if (Hss.empty())
      Rss.push_back(Ws);
    else
      for (auto X: Hss)
        Rss.push_back(X);
  }
  return Rss;
}

intS getSpine(intS cs) {
  int a = cs[1];
  int w = detag(a);
  intS rs(w - 1);
  for (int i = 0; i < w - 1; i++) {
    int x = cs[3 + i];
    int t = tagOf(x);
    if (R != t)
      throw cstr("*** getSpine: unexpected tag=") + t;
    rs[i] = detag(x);
  }
  return rs;
}
int relocate(int b, int cell) { return tagOf(cell) < 3 ? cell + b : cell; }
//const array_last=(a, def)=>a.length ? a[a.length - 1] : def
bool hasClauses(Spine S) { return S.k < S.cs.size(); }
bool hasGoals(Spine S) { return S.gs.size() > 0; }

class Prog : public Engine {
  Prog(cstr s) : Engine(s) {
  }

  void ppCode() {
    pp("\nSYMS:");
    pp(syms);
    pp("\nCLAUSES:\n");
    for (int i = 0; i < clauses.length; i++) {
      auto C = clauses[i];
      pp("[" + i + "]:" + showClause(C));
    }
    pp("");
  }
  string showClause(Clause s) {
    string r;
    int l = s.hgs.size();
    r += cstr("---base:[") + s.base + "] neck: " + s.neck + "-----\n";
    r += showCells2(s.base, s.len); // TODO
    r += "\n";
    r += showCell(s.hgs[0]);

    r += " :- [";
    for (int i = 1; i < l; i++) {
      auto e = s.hgs[i];
      r += showCell(e);
      if (i < l - 1)
        r += ", ";
    }
    r += "]\n";
    r += showTerm(s.hgs[0]);
    if (l > 1) {
      r += " :- \n";
      for (int i = 1; i < l; i++) {
        auto e = s.hgs[i];
        r += "  ";
        r += showTerm(e);
        r += "\n";
      }
    } else
      r += "\n";
    return r;
  }
  string showTerm(Term O) {
      /*
    if (typeof O === 'number')
      return showTerm(O);
    if (O instanceof Array)
      return st0(O);
    return JSON.stringify(O)
    */
  }
  void ppGoals(intS bs) {
    for (auto b: bs) {
      pp(showTerm(exportTerm(b)));
    }
  }
  void ppc(Spine S) {
    auto bs = S.gs;
    pp(cstr("\nppc: t=") + S.ttop + ",k=" + S.k + "len=" + bs.size());
    ppGoals(bs);
  }
}

cstr maybeNull(O) { return
  nullptr == O ? "$null" :
  O instanceof Array ? st0(O) :
  ''+O;
}

bool isListCons(cstr name) { return "." == name || "[|]" == name || "list" == name; }
bool isOp(cstr name)=>"/" === name || "-" === name || "+" === name || "=" === name
function st0(args) {
  var r = ''
  var name = ''+args[0]
  if (args.length == 3 && isOp(name)) {
    r += "("
    r += maybeNull(args[0])
    r += " " + name + " "
    r += maybeNull(args[1])
    r += ")"
  } else if (args.length == 3 && isListCons(name)) {
    r += '['
    r += maybeNull(args[1])
    var tail = args[2]
    for (;;) {
      if ("[]" === tail || "nil" === tail)
        break
      if (!(tail instanceof Array)) {
        r += '|'
        r += maybeNull(tail)
        break
      }
      var list = tail
      if (!(list.length == 3 && isListCons(list[0]))) {
        r += '|'
        r += maybeNull(tail)
        break
      } else {
        r += ','
        r += maybeNull(list[1])
        tail = list[2]
      }
    }
    r += ']'
  } else if (args.length == 2 && "$VAR" === name) {
    r += "_" + args[1]
  } else {
    var qname = maybeNull(args[0])
    r += qname
    r += "("
    for (var i = 1; i < args.length; i++) {
      var O = args[i]
      r += maybeNull(O)
      if (i < args.length - 1)
        r += ","
    }
    r += ")"
  }
  return r
}

}

#endif // HHPROLOG_H
