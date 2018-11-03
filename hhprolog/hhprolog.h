/*
Author: Carlo Capelli
Version: 1.0.0
License: MIT
Copyright (c) 2017,2018 Carlo Capelli
*/

#ifndef HHPROLOG_H
#define HHPROLOG_H

#include <string>
#include <vector>
#include <stdexcept>
#include <unordered_map>

namespace hhprolog {

using namespace std;

typedef const string cstr;
typedef long Int;

struct IntS : vector<Int> {

    IntS() : vector<Int>(){}
    IntS(Int s) : vector<Int>(size_t(s)){}

    IntS slice(size_t s) const {
        IntS r;
        while (s < size()) {
            r.push_back(at(s++));
        }
        return r;
    }
    IntS concat(const IntS &s) const {
        IntS r(*this);
        for (auto v: s)
            r.push_back(v);
        return r;
    }
};
typedef IntS IntList;
typedef IntS IntStack;

inline cstr operator+(cstr s, Int i) { return s + to_string(i); }
inline cstr operator+(cstr s, size_t i) { return s + to_string(i); }

typedef unordered_map<Int, IntS> t_imaps;
typedef unordered_map<Int, Int> t_IntMap;
typedef vector<t_IntMap> t_vmap;

struct Object {
    enum { t_null, t_int, t_string, t_vector } type;

    Object() : type(t_null) {}
    explicit Object(Int i) : type(t_int), i(i) {}
    Object(cstr s) : type(t_string), s(s) {}
    Object(vector<Object> v) : type(t_vector), v(v) {}

    int _; // remove padding warning

    Int i;
    string s;
    vector<Object> v;

    string toString() const {
        switch(type) {
        case t_null:
            return "$null";
        case t_int:
            return to_string(i);
        case t_string:
            return s;
        case t_vector: {
            string j;
            for (auto a: v) {
                if (!j.empty())
                    j += ",";
                j += a.toString();
            }
            return "(" + j + ")";
        }}
        throw logic_error("invalid term");
    }
};

namespace Toks {
    typedef vector<string> Ts;
    typedef vector<Ts> Tss;
    typedef vector<Tss> Tsss;

    Tsss toSentences(string s);
    Tss maybeExpand(Ts Ws);
    Tss mapExpand(Tss Wss);
};

struct Clause {
    Int len;
    IntS hgs;
    Int base;
    Int neck;
    IntS xs;
};
struct Spine {
    Int hd;     // head of the clause to which this corresponds
    Int base;   // top of the heap when this was created

    IntList gs; // goals - with the top one ready to unfold
    Int ttop;   // top of the trail when this was created

    Int k;
    IntS xs;    // index elements
    IntS cs;    // array of  clauses known to be unifiable with top goal in gs

    Spine(IntS gs0, Int base, IntList gs, Int ttop, Int k, IntS cs) :
        hd(gs0[0]),
        base(base),
        gs(gs0.concat(gs).slice(1)),
        ttop(ttop),
        k(k),
        cs(cs)
    {
    }

    Spine(Int hd, Int ttop) :
        hd(hd),
        base(0),
        ttop(ttop),
        k(-1)
    {
    }
};

const Int MINSIZE = 1 << 15;
const Int MAXIND = 3;
const Int START_INDEX = 20;

const Int V = 0;
const Int U = 1;
const Int R = 2;
const Int C = 3;
const Int N = 4;
const Int A = 5;
const Int BAD = 7;

class Engine {

public:

    Engine(string asm_nl_source);
    virtual ~Engine();

protected:

    vector<string> syms;
    vector<Clause> clauses;
    IntS cls;
    IntS heap;
    Int top;
    IntStack trail;
    IntStack ustack;
    vector<Spine> spines;

    Spine *query;

    t_imaps imaps;
    t_vmap vmaps;

    static inline Int tag(Int t, Int w) { return -((w << 3) + t); }
    static inline Int detag(Int w) { return -w >> 3; }
    static inline Int tagOf(Int w) { return -w & 7; }
    static inline bool isVAR(Int x) { return tagOf(x) < 2; }

    static void pp(string s);

    static cstr tagSym(Int t);
    static cstr heapCell(Int w);

    static IntS toNums(vector<Clause> clauses);

    static IntS getSpine(IntS cs);
    static inline Int relocate(Int b, Int cell) { return tagOf(cell) < 3 ? cell + b : cell; }

    static bool hasClauses(const Spine &S) { return S.k < Int(S.cs.size()); }
    static bool hasGoals(const Spine &S) { return S.gs.size() > 0; }

    Int addSym(cstr sym);
    cstr getSym(Int w) {
        if (w < 0 || w >= Int(syms.size()))
            throw logic_error(cstr("BADSYMREF=") + w);
        return syms[size_t(w)];
    }
    void makeHeap(Int size = MINSIZE) {
        heap.resize(size_t(size));
        clear();
    }
    void clear() {
        for (Int i = 0; i <= top; i++)
            heap[size_t(i)] = 0;
        top = -1;
    }
    void push(Int i) {
        heap[size_t(++top)] = i;
    }
    inline Int size() const {
        return top + 1;
    }
    void expand() {
        heap.resize(heap.size() * 2);
    }
    void ensureSize(Int more) {
        if (1 + top + more >= Int(heap.size()))
            expand();
    }
    vector<Clause> dload(cstr s);

    inline Int getRef(Int x) { return heap[size_t(detag(x))]; }
    inline void setRef(Int w, Int r) { heap[size_t(detag(w))] = r; }
    inline Int encode(Int t, cstr s) {
        Int w = C == t ? addSym(s) : stoi(s);
        return tag(t, w);
    }
    inline void unwindTrail(Int savedTop) {
        while (savedTop < Int(trail.size()) - 1) {
            Int href = trail[trail.size() - 1];
            trail.pop_back();
            setRef(href, href);
        }
    }
    inline Int deref(Int x) {
        while (isVAR(x)) {
            auto r = getRef(x);
            if (r == x)
                break;
            x = r;
        }
        return x;
    }

    /**
     * raw display of a term - to be overridden
     */
    virtual string showTerm(Int x) {
      return showTerm(exportTerm(x));
    }

    /**
     * raw display of a externalized term
     */
    virtual string showTerm(Object O) {
      /*
       if (O.type == Object::t_vector)
        return Arrays.deepToString((Object[]) O);
      */
      return O.toString();
    }

    void ppTrail() {
        for (Int i = 0; i <= trail[trail.size()-1]; i++) {
            Int t = trail[size_t(i)];
            pp(cstr("trail[") + i + "]=" + showCell(t) + ":" + showTerm(t));
        }
    }
    Object exportTerm(Int x);
    string showCell(Int w);
    string showCells2(Int base, Int len) {
        string buf;
        for (Int k = 0; k < len; k++) {
            Int instr = heap[size_t(base + k)];
            buf += cstr("[") + (base + k) + "]" + showCell(instr) + " ";
        }
        return buf;
    }
    string showCells1(IntS cs) {
        string buf;
        for (size_t k = 0; k < cs.size(); k++)
            buf += cstr("[") + k + "]" + showCell(cs[k]) + " ";
        return buf;
    }

    void ppc(const Clause &) {}
    void ppGoals(const IntS &) {}
    void ppSpines() {}

    bool unify(Int base);
    bool unify_args(Int w1, Int w2);

    Clause putClause(IntS cs, IntS gs, Int neck) {
        Int base = size();
        Int b = tag(V, base);
        Int len = Int(cs.size());
        pushCells2(b, 0, len, cs);
        for (size_t i = 0; i < gs.size(); i++)
            gs[i] = relocate(b, gs[i]);
        auto xs = getIndexables(gs[0]);
        return Clause{len, gs, base, neck, xs};
    }
    void pushCells1(Int b, Int from, Int to, Int base) {
        ensureSize(to - from);
        for (Int i = from; i < to; i++)
            push(relocate(b, heap[size_t(base + i)]));
    }
    void pushCells2(Int b, Int from, Int to, IntS &cs) {
        ensureSize(to - from);
        for (Int i = from; i < to; i++)
            push(relocate(b, cs[size_t(i)]));
    }
    Int pushHead(Int b, const Clause& C) {
        pushCells1(b, 0, C.neck, C.base);
        return relocate(b, C.hgs[0]);
    }
    IntS pushBody(Int b, Int head, Clause& C) {
        pushCells1(b, C.neck, C.len, C.base);
        auto l = C.hgs.size();
        IntS gs(static_cast<Int>(l));
        gs[0] = head;
        for (size_t k = 1; k < l; k++) {
            auto cell = C.hgs[k];
            gs[k] = relocate(b, cell);
        }
        return gs;
    }

    void makeIndexArgs(Spine& G);
    IntS getIndexables(Int ref);
    Int cell2index(Int cell);

    static inline bool match(const IntS &xs, const Clause &C0) {
        for (size_t i = 0; i < MAXIND; i++) {
            Int x = xs[i];
            Int y = C0.xs[i];
            if (0 == x || 0 == y)
                continue;
            if (x != y)
                return false;
        }
        return true;
    }
    Spine* unfold(Spine& G);
    Clause getQuery() {
        return clauses.back();
    }
    Spine* init() {
        Int base = size();
        Clause G = getQuery();
        Spine Q(G.hgs, base, IntS(), -1 /*trail.back()*/, 0, cls);
        spines.push_back(Q);
        return &spines.back();
    }
    Spine* answer(Int ttop) { return new Spine(spines[0].hd, ttop); }
    void popSpine() {
        auto G = spines.back(); spines.pop_back();
        unwindTrail(G.ttop);
        top = G.base - 1;
    }
    Spine* yield_();
    string heap2s() {
        return ""; //string("[") + top + ' ' + heap.slice(0,top).vmap([](Int x) {return heapCell(x); }).join(',') + ']';
    }
    Object ask();

    Toks::Tss vcreate(size_t l) {
        return Toks::Tss(l);
    }

    void put(IntS keys, Int val) {
        for (Int i = 0; i < Int(imaps.size()); i++) {
            Int key = keys[size_t(i)];
            if (key != 0)
                imaps[i][size_t(key)] = val;
            else
                vmaps[size_t(i)][val] = val;
        }
    }
    void index(vector<Clause> clauses) {
        if (clauses.size() < START_INDEX)
            return;
        //var T = JSON.stringify
        imaps = t_imaps(vmaps.size());
        for (size_t i = 0; i < clauses.size(); i++) {
            Clause c = clauses[i];
            //pp("!!!xs=" + T(c.xs) + ":" + this.showCells1(c.xs) + "=>" + i)
            put(c.xs, Int(i + 1)); // $$$ UGLY INC
            //pp(T(imaps));
        }
        /*
        pp("INDEX");
        pp(T(imaps));
        pp(T(vmaps));
        pp("");
        */
    }
};

class Prog : public Engine {

public:
    Prog(string s);
    virtual ~Prog();

    void run(bool print_ans);
    void ppCode();

protected:

    string showClause(const Clause &s);
    virtual string showTerm(Object O);

    void ppGoals(IntS bs) {
        for (auto b: bs) {
            pp(showTerm(exportTerm(b)));
        }
    }
    void ppc(Spine S) {
        auto bs = S.gs;
        pp(cstr("\nppc: t=") + S.ttop + ",k=" + S.k + "len=" + bs.size());
        ppGoals(bs);
    }

    static string maybeNull(Object O) {
      if (O.type == Object::t_null)
        return "$null";
      if (O.type == Object::t_vector)
        return st0(O.v);
      return O.toString();
    }
    static inline bool isListCons(cstr name) { return "." == name || "[|]" == name || "list" == name; }
    static inline bool isOp(cstr name) { return "/" == name || "-" == name || "+" == name || "=" == name; }

    static string st0(vector<Object> args);
};

}

#endif // HHPROLOG_H
