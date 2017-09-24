// Original code by Paul Tarau. Ported by CapelliC.

const Spine = require('./Spine')
const Clause = require('./Clause')
const IntStack = require('./IntStack')
const IntList = require('./IntList')

const MAXIND = 3 // number of index args
const START_INDEX = 20

const pp = console.log

  /**
   * tags of our heap cells - that can also be seen as
   * instruction codes in a compiled implementation
   */
  const V = 0
  const U = 1
  const R = 2

  const C = 3
  const N = 4

  const A = 5

  // G - ground?
  const BAD = 7

/**
 * Implements execution mechanism
 */
class Engine {

  // switches off indexing for less then START_INDEX clauses e.g. <20

  /**
   * Builds a new engine from a natural-language style assembler.nl file
   */
  constructor(asm_nl_source) {
    this.syms = []
    this.slist = []

    this.makeHeap()

    this.trail = new IntStack()
    this.ustack = new IntStack()

    // trimmed down clauses ready to be quickly relocated to the heap
    this.clauses = this.dload(asm_nl_source)

    // symbol table made of map + reverse map from ints to syms
    this.cls = Engine.toNums(this.clauses)

    this.query = this.init()

    this.vmaps = this.vcreate(MAXIND)
    this.imaps = this.index(this.clauses, vmaps)
  }

  /**
   * trimmed down clauses ready to be quickly relocated to the heap
   */
  //final Clause[] clauses;

  //final int[] cls;
  /** symbol table made of map + reverse map from ints to syms */

  //final LinkedHashMap<String, Integer> syms;
  //final private ArrayList<String> slist;

  /** runtime areas:
   *
   * the heap contains code for and clauses their their copies
   * created during execution
   *
   * the trail is an undo list for variable bindings
   * that facilitates retrying failed goals with alternative
   * matching clauses
   *
   * the unification stack ustack helps handling term unification non-recursively
   *
   * the spines stack contains abstractions of clauses and goals and performs the
   * functions of  both a choice-point stack and goal stack
   *
   * imaps: contains indexes for up toMAXIND>0 arg positions (0 for pred symbol itself)
   *
   * vmaps: contains clause numbers for which vars occur in indexed arg positions
   */

    /*
  private int heap[];
  private int top;
  static int MINSIZE = 1 << 15; // power of 2

  final private IntStack trail;
  final private IntStack ustack;
  final private ObStack<Spine> spines = new ObStack<Spine>();

  Spine query;

  final IMap<Integer>[] imaps;
  final IntMap[] vmaps;
    */
    
  /**
   * tags of our heap cells - that can also be seen as
   * instruction codes in a compiled implementation
   *
  const V = 0
  const U = 1
  const R = 2

  const C = 3
  const N = 4

  const A = 5

  // G - ground?
  const BAD = 7
    */
    
  /**
   * tags an integer value while flipping it into a negative
   * number to ensure that untagged cells are always negative and the tagged
   * ones are always positive - a simple way to ensure we do not mix them up
   * at runtime
   */
  static tag(t, w) {
    return -((w << 3) + t)
  }

  /**
   * removes tag after flipping sign
   */
  static detag(w) {
    return -w >> 3
  }

  /**
   * extracts the tag of a cell
   */
  static tagOf(w) {
    return -w & 7
  }

  /**
   * places an identifier in the symbol table
   */
  addSym(sym) {
    let I = this.syms.get(sym)
    if (null == I) {
      let i = this.syms.size()
      I = new Integer(i)
      this.syms.put(sym, I)
      this.slist.add(sym)
    }
    return I.intValue()
  }

  /**
   * returns the symbol associated to an integer index
   * in the symbol table
   */
  getSym(w) {
    if (w < 0 || w >= this.slist.size())
      return "BADSYMREF=" + w;
    return this.slist.get(w);
  }

  makeHeap() {
    makeHeap(MINSIZE)
  }

  makeHeap(size) {
    this.heap = new Int32Array(size)
    this.clear()
  }

  getTop() {
    return this.top;
  }

  setTop(top) {
    return this.top = top;
  }

  clear() {
    //for (int i = 0; i <= top; i++)
    //heap[i] = 0;
    this.top = -1;
  }

  /**
   * Pushes an element - top is incremented frirst than the
   * element is assigned. This means top point to the last assigned
   * element - which can be returned with peek().
   */
  push(i) {
    this.heap[++this.top] = i;
  }

  size() {
    return this.top + 1;
  }

  /**
   * dynamic array operation: doubles when full
   */
  expand() {
    let l = heap.length;
    let newstack = new int[l << 1];
    System.arraycopy(heap, 0, newstack, 0, l);
    heap = newstack;
  }

  ensureSize(more) {
    if (1 + top + more >= heap.length) {
      expand();
    }
  }

  /**
  * expands a "Xs lists .." statements to "Xs holds" statements
  */

  static maybeExpand(Ws) {
    let W = Ws.get(0)
    if (W.length() < 2 || !"l:".equals(W.substring(0, 2)))
      return null

    let l = Ws.size()
    //final ArrayList<String[]> Rss = new ArrayList<String[]>();
    let Rss = []
    let V = W.substring(2)
    for (let i = 1; i < l; i++) {
      let Rs = ['', '', '', '']
      let Vi = 1 == i ? V : V + "__" + (i - 1)
      let Vii = V + "__" + i
      Rs[0] = "h:" + Vi
      Rs[1] = "c:list"
      Rs[2] = Ws.get(i)
      Rs[3] = i == l - 1 ? "c:nil" : "v:" + Vii
      Rss.add(Rs)
    }
    return Rss
  }

  /**
   * expands, if needed, "lists" statements in sequence of statements
   */
  static mapExpand(Wss) {
    let Rss = new []
    for (let Ws of Wss) {
      let Hss = Engine.maybeExpand(Ws)
      if (null == Hss) {
        let ws = []
        for (let i = 0; i < ws.length; i++) {
          ws[i] = Ws.get(i)
        }
        Rss.push(ws)
      } else {
        for (X of Hss) {
          Rss.push(X)
        }
      }
    }
    return Rss
  }

  /**
   * loads a program from a .nl file of
   * "natural language" equivalents of Prolog/HiLog statements
   */
  dload(s) {
      const tag = Engine.tag
      
    let fromFile = true
    let Wsss = Toks.toSentences(s)
    let Cs = []
    for (Wss of Wsss) {
      // clause starts here
      let refs = []
      let cs = []
      let gs = []

      let Rss = Engine.mapExpand(Wss)
      let k = 0
      for (let ws of Rss) {

        // head or body element starts here

        let l = ws.length
        gs.push(tag(R, k++))
        cs.push(tag(A, l))

        for (let w of ws) {

          // head or body subterm starts here

          if (1 == w.length()) {
            w = "c:" + w
          }

          let L = w.substring(2)

          switch (w.charAt(0)) {
            case 'c':
              cs.push(encode(C, L))
              k++
            break
            case 'n':
              cs.push(encode(N, L))
              k++
            break;
            case 'v': {
              let Is = refs.get(L)  // IntStack Is
              if (null == Is) {
                Is = new IntStack()
                refs.put(L, Is)
              }
              Is.push(k)
              cs.push(tag(BAD, k))  // just in case we miss this
              k++
            }
            break;
            case 'h': {
              let Is = refs.get(L)  // IntStack Is
              if (null == Is) {
                Is = new IntStack()
                refs.put(L, Is)
              }
              Is.push(k - 1)
              cs.set(k - 1, tag(A, l - 1))
              gs.pop()
            }
            break
            default:
              pp("FORGOTTEN=" + w)
          } // end subterm
        } // end element
      } // end clause

      // linker
      //final Iterator<IntStack> K = refs.values().iterator();
      let K = refs.values().iterator()

      while (K.hasNext()) {
        //final IntStack Is = K.next();
        let Is = K.next()

        // finding the A among refs
        let leader = -1
        for (let j of Is.toArray()) {
          if (A == Engine.tagOf(cs.get(j))) {
            leader = j
            break;
          }
        }
        if (-1 == leader) {
          // for vars, first V others U
          leader = Is.get(0)
          for (let i of Is.toArray()) {
            if (i == leader) {
              cs.set(i, tag(V, i))
            } else {
              cs.set(i, tag(U, leader))
            }

          }
        } else {
          for (let i of Is.toArray()) {
            if (i == leader) {
              continue
            }
            cs.set(i, tag(R, leader))
          }
        }
      }

      /*
      final int neck = 1 == gs.size() ? cs.size() : detag(gs.get(1));
      final int[] tgs = gs.toArray();
      final Clause C = putClause(cs.toArray(), tgs, neck);
      */
      let neck = 1 == gs.size() ? cs.size() : Engine.detag(gs.get(1))
      let tgs = gs.toArray()
      let C = putClause(cs.toArray(), tgs, neck)

      Cs.add(C)

    } // end clause set

    let ccount = Cs.size()
    let cls = Array(ccount).fill().map(_ => new Clause)
    for (let i = 0; i < ccount; i++) {
      cls[i] = Cs.get(i)
    }
    return cls
  }

  static toNums(clauses) {
    return Array(clauses.length).fill().map((_, i) => i)
  }

  /*
   * encodes string constants into symbols while leaving
   * other data types untouched
   */
  encode(t, s) {
    let w = 0
    try {
      w = Integer.parseInt(s)
    } catch (e) {
      if (C == t) {
        w = this.addSym(s)
      } else
        //pp("bad in encode=" + t + ":" + s);
        return Engine.tag(BAD, 666)
    }
    return Engine.tag(t, w)
  }

  /**
   * true if cell x is a variable
   * assumes that variables are tagged with 0 or 1
   */
  static isVAR(x) {
    //final int t = tagOf(x);
    //return V == t || U == t;
    return Engine.tagOf(x) < 2
  }

  /**
   * returns the heap cell another cell points to
   */
  getRef(x) {
    return this.heap[Engine.detag(x)]
  }

  /*
   * sets a heap cell to point to another one
   */
  setRef(w, r) {
    this.heap[Engine.detag(w)] = r
  }

  /**
   * removes binding for variable cells
   * above savedTop
   */
  unwindTrail(savedTop) {
    while (savedTop < trail.getTop()) {
      let href = trail.pop()
      // assert href is var
      this.setRef(href, href)
    }
  }

  /**
   * scans reference chains starting from a variable
   * until it points to an unbound root variable or some
   * non-variable cell
   */
  deref(x) {
    while (Engine.isVAR(x)) {
      let r = this.getRef(x)
      if (r == x) {
        break
      }
      x = r
    }
    //*
    switch (Engine.tagOf(x)) {
      case V:
      case R:
      case C:
      case N:
      break;
      default:
        pp("unexpected deref=" + this.showCell(x));
    }
    //*/
    return x
  }

  /**
   * raw display of a term - to be overridden
   */
  showTerm(x) {
    if (Number.isInteger(x))
      return this.showTerm(this.exportTerm(x))
    if (x instanceof Array)
      return x.join(',')
    return '' + x
  }

  /**
   * raw display of a externalized term
  String showTerm(final Object O) {
    if (O instanceof Object[])
      return Arrays.deepToString((Object[]) O);
    return O.toString();
  }
   */

  /**
   * prints out content of the trail
   */
  ppTrail() {
    for (let i = 0; i <= this.trail.getTop(); i++) {
      let t = trail.get(i)
      pp("trail[" + i + "]=" + this.showCell(t) + ":" + this.showTerm(t))
    }
  }

  /**
   * builds an array of embedded arrays from a heap cell
   * representing a term for interaction with an external function
   * including a displayer
   */
  exportTerm(x) {
    x = this.deref(x)

    let t = Engine.tagOf(x)
    let w = Engine.detag(x)

    let res = null
    switch (t) {
      case C:
        res = this.getSym(w)
      break
      case N:
        res = parseInt(w)
      break
      case V:
        //case U:
        res = "V" + w
      break
      case R: {

        let a = this.heap[w]
        if (A != Engine.tagOf(a))
          return "*** should be A, found=" + showCell(a)
        let n = Engine.detag(a)
        let arr = Array(n).fill()
        let k = w + 1
        for (let i = 0; i < n; i++) {
          let j = k + i
          arr[i] = exportTerm(this.heap[j])
        }
        res = arr
      }
      break
      default:
        res = "*BAD TERM*" + showCell(x)
    }
    return res
  }

  /**
   * extracts an integer array pointing to
   * the skeleton of a clause: a cell
   * pointing to its head followed by cells pointing to its body's
   * goals
   */
  static getSpine(cs) {
    let a = cs[1]
    let w = Engine.detag(a)
    let rs = Array(w - 1).fill()
    for (let i = 0; i < w - 1; i++) {
      let x = cs[3 + i]
      let t = Engine.tagOf(x)
      if (R != t) {
        pp("*** getSpine: unexpected tag=" + t)
        return null
      }
      rs[i] = Engine.detag(x)
    }
    //Main.println("");
    return rs;
  }

  /**
   * raw display of a cell as tag : value
   */
  showCell(w) {
    let t = Engine.tagOf(w)
    let val = Engine.detag(w)
    let s = null
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
        s = "c:" + getSym(val)
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

  /**
   * a displayer for cells
   */

  showCells(base, len) {
    let buf = new StringBuffer()
    for (let k = 0; k < len; k++) {
      let instr = this.heap[base + k];

      buf.append("[" + (base + k) + "]")
      buf.append(this.showCell(instr))
      buf.append(" ")
    }
    return buf.toString()
  }

  showCells(cs) {
    let buf = new StringBuffer()
    for (let k = 0; k < cs.length; k++) {
      buf.append("[" + k + "]")
      buf.append(showCell(cs[k]))
      buf.append(" ")
    }
    return buf.toString()
  }

  /**
  * to be overridden as a printer of a spine
  */
  ppc(C) {
    // override
  }

  /**
   * to be overridden as a printer for current goals
   * in a spine
   */
  ppGoals(gs) {
    // override
  }

  /**
   * to be overriden as a printer for spines
   */
  ppSpines() {
    // override
  }

  /**
   * unification algorithm for cells X1 and X2 on ustack that also takes care
   * to trail bindigs below a given heap address "base"
   */
  unify(base) {
    while (!this.ustack.isEmpty()) {
      let x1 = this.deref(ustack.pop())
      let x2 = this.deref(ustack.pop())
      if (x1 != x2) {
        let t1 = Engine.tagOf(x1)
        let t2 = Engine.tagOf(x2)
        let w1 = Engine.detag(x1)
        let w2 = Engine.detag(x2)

        if (Engine.isVAR(x1)) { /* unb. var. v1 */
          if (Engine.isVAR(x2) && w2 > w1) { /* unb. var. v2 */
            heap[w2] = x1
            if (w2 <= base) {
              trail.push(x2)
            }
          } else { // x2 nonvar or older
            heap[w1] = x2
            if (w1 <= base) {
              trail.push(x1)
            }
          }
        } else if (Engine.isVAR(x2)) { /* x1 is NONVAR */
          heap[w2] = x1
          if (w2 <= base) {
            trail.push(x2)
          }
        } else if (R == t1 && R == t2) { // both should be R
          if (!unify_args(w1, w2))
            return false
        } else
          return false
      }
    }
    return true
  }

  unify_args(w1, w2) {
    let v1 = this.heap[w1]
    let v2 = this.heap[w2]
    // both should be A
    let n1 = Engine.detag(v1)
    let n2 = Engine.detag(v2)
    if (n1 != n2)
      return false
    let b1 = 1 + w1
    let b2 = 1 + w2
    for (let i = n1 - 1; i >= 0; i--) {
      let i1 = b1 + i
      let i2 = b2 + i
      let u1 = this.heap[i1]
      let u2 = this.heap[i2]
      if (u1 == u2) {
        continue
      }
      this.ustack.push(u2)
      this.ustack.push(u1)
    }
    return true
  }

  /**
   * places a clause built by the Toks reader on the heap
   */
  putClause(cs, gs, neck) {
    let base = size()
    let b = Engine.tag(V, base)
    let len = cs.length
    this.pushCells(b, 0, len, cs)
    for (let i = 0; i < gs.length; i++) {
      gs[i] = this.relocate(b, gs[i])
    }
    let xs = getIndexables(gs[0])
    return new Clause(len, gs, base, neck, xs)
  }

  /**
   * relocates a variable or array reference cell by b
   * assumes var/ref codes V,U,R are 0,1,2
   */
  static relocate(b, cell) {
    return Engine.tagOf(cell) < 3 ? cell + b : cell
  }

  /**
   * pushes slice[from,to] of array cs of cells to heap
   */
  pushCells(b, from, to, base) {
    this.ensureSize(to - from);
    for (let i = from; i < to; i++) {
      this.push(this.relocate(b, this.heap[base + i]))
    }
  }

  /**
   * pushes slice[from,to] of array cs of cells to heap
   */
  pushCells(b, from, to, cs) {
    this.ensureSize(to - from)
    for (let i = from; i < to; i++) {
      this.push(this.relocate(b, cs[i]))
    }
  }

  /**
   * copies and relocates head of clause at offset from heap to heap
   */
  pushHead(b, C) {
    this.pushCells(b, 0, C.neck, C.base)
    let head = C.hgs[0]
    return this.relocate(b, head)
  }

  /**
   * copies and relocates body of clause at offset from heap to heap
   * while also placing head as the first element of array gs that
   * when returned contains references to the toplevel spine of the clause
   */
  pushBody(b, head, C) {
    this.pushCells(b, C.neck, C.len, C.base)
    let l = C.hgs.length
    let gs = new int[l]
    gs[0] = head
    for (let k = 1; k < l; k++) {
      let cell = C.hgs[k]
      gs[k] = this.relocate(b, cell)
    }
    return gs
  }

  /**
   * makes, if needed, registers associated to top goal of a Spine
   * these registers will be reused when matching with candidate clauses
   * note that regs contains dereferenced cells - this is done once for
   * each goal's toplevel subterms
   */
  makeIndexArgs(G) {
    let goal = IntList.head(G.gs)
    if (null != G.xs)
      return
    let p = 1 + Engine.detag(goal)
    let n = Math.min(MAXIND, Engine.detag(this.getRef(goal)))

    let xs = new int[MAXIND]
    for (let i = 0; i < n; i++) {
      let cell = this.deref(this.heap[p + i])
      xs[i] = this.cell2index(cell)
    }
    G.xs = xs

    if (null == imaps)
      return
    let cs = IMap.get(imaps, vmaps, xs)
    G.cs = cs
  }

  getIndexables(ref) {
    let p = 1 + Engine.detag(ref)
    let n = Engine.detag(this.getRef(ref))
    let xs = new int[MAXIND]
    for (let i = 0; i < MAXIND && i < n; i++) {
      let cell = this.deref(heap[p + i])
      xs[i] = this.cell2index(cell)
    }
    return xs
  }

  cell2index(cell) {
    let x = 0
    let t = Engine.tagOf(cell)
    switch (t) {
      case R:
        x = this.getRef(cell)
      break
      case C:
      case N:
        x = cell
      break
      // 0 otherwise - assert: tagging with R,C,N <>0
    }
    return x
  }

  /**
   * tests if the head of a clause, not yet copied to the heap
   * for execution could possibly match the current goal, an
   * abstraction of which has been place in regs
   */
  match(xs, C0) {
    for (let i = 0; i < MAXIND; i++) {
      let x = xs[i]
      let y = C0.xs[i]
      if (0 == x || 0 == y) {
        continue
      }
      if (x != y)
        return false
    }
    return true
  }

  /**
   * transforms a spine containing references to choice point and
   * immutable list of goals into a new spine, by reducing the
   * first goal in the list with a clause that successfully
   * unifies with it - in which case places the goals of the
   * clause at the top of the new list of goals, in reverse order
   */
  unfold(G) {

    let ttop = this.trail.getTop()
    let htop = this.getTop()
    let base = htop + 1

    this.makeIndexArgs(G)

    let last = G.cs.length
    for (let k = G.k; k < last; k++) {
      let C0 = this.clauses[G.cs[k]]

      if (!this.match(G.xs, C0)) {
        continue
      }

      let base0 = base - C0.base
      let b = Engine.tag(V, base0)
      let head = this.pushHead(b, C0)

      ustack.clear() // set up unification stack

      ustack.push(head)
      ustack.push(IntList.head(G.gs))

      if (!unify(base)) {
        unwindTrail(ttop)
        setTop(htop)
        continue
      }

      let gs = pushBody(b, head, C0)
      let newgs = IntList.tail(IntList.app(gs, IntList.tail(G.gs)))
      G.k = k + 1
      if (!IntList.isEmpty(newgs))
        return new Spine(gs, base, IntList.tail(G.gs), ttop, 0, cls)
      else
        return answer(ttop)
    } // end for
    return null
  }

  /**
   * extracts a query - by convention of the form
   * goal(Vars):-body to be executed by the engine
   */
  getQuery() {
    return this.clauses[this.clauses.length - 1];
  }

  /**
   * returns the initial spine built from the
   * query from which execution starts
   */
  init() {
    let base = this.size()
    let G = this.getQuery()
    let Q = new Spine(G.hgs, this.base, IntList.empty, this.trail.getTop(), 0, this.cls)
    this.spines.push(Q)
    return Q
  }

  /**
   * returns an answer as a Spine while recording in it
   * the top of the trail to allow the caller to retrieve
   * more answers by forcing backtracking
   */
  answer(ttop) {
    return new Spine(this.spines.get(0).hd, ttop)
  }

  /**
   * detects availability of alternative clauses for the
   * top goal of this spine
   */
  //final private boolean hasClauses(final Spine S) {
  //  return S.k < S.cs.length;
  //}

  /**
   * true when there are no more goals left to solve
   */
  hasGoals(S) {
    return !IntList.isEmpty(S.gs)
  }

  /**
   * removes this spines for the spine stack and
   * resets trail and heap to where they where at its
   * creating time - while undoing variable binding
   * up to that point
   */
  popSpine() {
    let G = this.spines.pop()
    this.unwindTrail(G.ttop)
    this.setTop(G.base - 1)
  }

  /**
   * main interpreter loop: starts from a spine and works
   * though a stream of answers, returned to the caller one
   * at a time, until the spines stack is empty - when it
   * returns null
   */
  yield_() {
    while (!this.spines.isEmpty()) {
      let G = this.spines.peek()

      /*
      if (!hasClauses(G)) {
        popSpine(); // no clauses left
        continue;
      }
      */

      let C = this.unfold(G)

      if (null == C) {
        popSpine() // no matches
        continue
      }

      if (hasGoals(C)) {
        spines.push(C)
        continue
      }
      return C // answer
    }
    return null
  }

  /**
   * retrieves an answers and ensure the engine can be resumed
   * by unwinding the trail of the query Spine
   * returns an external "human readable" representation of the answer
   */
  ask() {
    this.query = this.yield_()
    if (null == query)
      return null
    let res = this.answer(query.ttop).hd
    let R = this.exportTerm(res)
    this.unwindTrail(query.ttop)
    return R
  }

  /**
   * initiator and consumer of the stream of answers
   * generated by this engine
   */
  run() {
    let ctr = 0
    for (;; ctr++) {
      let A = this.ask()
      if (null == A) {
        break
      }
      pp("[" + ctr + "] " + "*** ANSWER=" + this.showTerm(A))
    }
    pp("TOTAL ANSWERS=" + ctr)
  }

  // indexing extensions - ony active if START_INDEX clauses or more

  vcreate(l)
  {
    let vss = []
    for (let i = 0; i < l; i++)
      vss.push(new IntMap)
    return vss
  }

  put(imaps, vss, keys, val)
  {
    for (let i = 0; i < imaps.length; i++) {
      let key = keys[i]
      if (key != 0) {
        IMap.put(imaps, i, key, val)
      } else {
        vss[i].add(val)
      }
    }
  }

  index(clauses, vmaps)
  {
    if (clauses.length < START_INDEX)
      return null

    let imaps = IMap.create(vmaps.length)
    for (let i = 0; i < clauses.length; i++) {
      let c = clauses[i]
      //Main.pp("!!!xs=" + java.util.Arrays.toString(c.xs) + ":" + showCells(c.xs) + "=>" + i);
      put(imaps, vmaps, c.xs, i + 1) // $$$ UGLY INC
      //Main.pp(IMap.show(imaps));
    }
    pp("INDEX")
    pp(IMap.show(imaps))
    pp(Arrays.toString(vmaps))
    pp("")
    return imaps
  }
}

exports.Engine = Engine
