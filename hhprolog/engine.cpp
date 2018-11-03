/*
Author: Carlo Capelli
Version: 1.0.0
License: MIT
Copyright (c) 2018 Carlo Capelli
*/

#include "hhprolog.h"

#include <map>
#include <numeric>
#include <iostream>
#include <algorithm>

namespace hhprolog {

Engine::Engine(string asm_nl_source) {
    makeHeap();

    clauses = dload(asm_nl_source);
    cls = toNums(clauses);

    query = init();

    //vmaps = vcreate(MAXIND);
    //imaps = index(clauses, vmaps);
}
Engine::~Engine() {

}

Spine* Engine::unfold(Spine& G) {
    Int ttop = Int(trail.size()) - 1;
    Int htop = top;
    Int base = htop + 1;

    makeIndexArgs(G);

    Int last = Int(G.cs.size());
    for (Int k = G.k; k < last; k++) {
        Clause& C0 = clauses[size_t(G.cs[size_t(k)])];
        if (!match(G.xs, C0))
            continue;
        Int base0 = base - C0.base;
        Int b = tag(V, base0);
        Int head = pushHead(b, C0);
        ustack.clear();
        ustack.push_back(head);
        ustack.push_back(G.gs[0]);
        if (!unify(base)) {
            unwindTrail(ttop);
            top = htop;
            continue;
        }
        IntS gs = pushBody(b, head, C0);
        IntList newgs = gs.concat(G.gs.slice(1)).slice(1);
        G.k = k + 1;
        if (newgs.size())
            return new Spine(gs, base, G.gs.slice(1), ttop, 0, cls);
        else
            return answer(ttop);
    }
    return nullptr;
}
bool Engine::unify(Int base) {
    while (ustack.size()) {
        Int x1 = deref(ustack.back()); ustack.pop_back();
        Int x2 = deref(ustack.back()); ustack.pop_back();
        if (x1 != x2) {
            Int t1 = tagOf(x1);
            Int t2 = tagOf(x2);
            Int w1 = detag(x1);
            Int w2 = detag(x2);
            if (isVAR(x1)) {
                if (isVAR(x2) && w2 > w1) {
                    heap[size_t(w2)] = x1;
                    if (w2 <= base)
                        trail.push_back(x2);
                } else {
                    heap[size_t(w1)] = x2;
                    if (w1 <= base)
                        trail.push_back(x1);
                }
            } else if (isVAR(x2)) {
                heap[size_t(w2)] = x1;
                if (w2 <= base)
                    trail.push_back(x2);
            } else if (R == t1 && R == t2) {
                if (!unify_args(w1, w2))
                    return false;
            } else
                return false;
        }
    }
    return true;
}

bool Engine::unify_args(Int w1, Int w2) {
    Int v1 = heap[size_t(w1)];
    Int v2 = heap[size_t(w2)];
    // both should be A
    Int n1 = detag(v1);
    Int n2 = detag(v2);
    if (n1 != n2)
        return false;
    Int b1 = 1 + w1;
    Int b2 = 1 + w2;
    for (Int i = n1 - 1; i >= 0; i--) {
        Int i1 = b1 + i;
        Int i2 = b2 + i;
        Int u1 = heap[size_t(i1)];
        Int u2 = heap[size_t(i2)];
        if (u1 == u2)
            continue;
        ustack.push_back(u2);
        ustack.push_back(u1);
    }
    return true;
}

void Engine::pp(string s) {
    cout << s << endl;
}
cstr Engine::tagSym(Int t) {
    if (t == V) return "V";
    if (t == U) return "U";
    if (t == R) return "R";
    if (t == C) return "C";
    if (t == N) return "N";
    if (t == A) return "A";
    return "?";
}
cstr Engine::heapCell(Int w) {
    return tagSym(tagOf(w))+":"+detag(w)+"["+w+"]";
}

Int Engine::addSym(cstr sym) {
    auto I = find(syms.begin(), syms.end(), sym);
    if (I == syms.end()) {
        syms.push_back(sym);
        return Int(syms.size() - 1);
    }
    return distance(syms.begin(), I);
}

IntS Engine::getSpine(IntS cs) {
    Int a = cs[1];
    Int w = detag(a);
    IntS rs(w - 1);
    for (Int i = 0; i < w - 1; i++) {
        Int x = cs[3 + size_t(i)];
        Int t = tagOf(x);
        if (R != t)
            throw logic_error(cstr("*** getSpine: unexpected tag=") + t);
        rs[size_t(i)] = detag(x);
    }
    return rs;
}

vector<Clause> Engine::dload(cstr s) {
    auto Wsss = Toks::toSentences(s);
    vector<Clause> Cs;
    for (auto Wss: Wsss) {
        map<string, IntS> refs;
        IntS cs;
        IntS gs;
        auto Rss = Toks::mapExpand(Wss);
        Int k = 0;
        for (auto ws: Rss) {
            Int l = Int(ws.size());
            gs.push_back(tag(R, k++));
            cs.push_back(tag(A, l));
            for (auto w: ws) {
                if (1 == w.size())
                    w = "c:" + w;
                auto L = w.substr(2);
                switch (w[0]) {
                case 'c':
                    cs.push_back(encode(C, L));
                    k++;
                    break;
                case 'n':
                    cs.push_back(encode(N, L));
                    k++;
                    break;
                case 'v':
                    refs[L].push_back(k);
                    cs.push_back(tag(BAD, k));
                    k++;
                    break;
                case 'h':
                    refs[L].push_back(k - 1);
                    cs[size_t(k - 1)] = tag(A, l - 1);
                    gs.pop_back();
                    break;
                default:
                    throw logic_error("FORGOTTEN=" + w);
                }
            }
        }

        for (auto kIs: refs) {
            auto Is = kIs.second;
            Int leader = -1;
            for (auto j: Is)
                if (A == tagOf(cs[size_t(j)])) {
                    leader = j;
                    break;
                }
            if (-1 == leader) {
                leader = Is[0];
                for (auto i: Is)
                    if (i == leader)
                        cs[size_t(i)] = tag(V, i);
                    else
                        cs[size_t(i)] = tag(U, leader);
            } else
                for (auto i: Is) {
                    if (i == leader)
                        continue;
                    cs[size_t(i)] = tag(R, leader);
                }
        }
        auto neck = 1 == gs.size() ? Int(cs.size()) : detag(gs[1]);
        auto tgs = gs;
        Cs.push_back(putClause(cs, tgs, neck));
    }
    return Cs;
}

Object Engine::exportTerm(Int x) {
    x = deref(x);
    Int t = tagOf(x);
    Int w = detag(x);

    switch (t) {
    case C:
        return getSym(w);
    case N:
        return Object(w);
    case V:
        //case U:
        return cstr("V") + w;
    case R: {
        Int a = heap[size_t(w)];
        if (A != tagOf(a))
            throw logic_error(cstr("*** should be A, found=") + showCell(a));
        Int n = detag(a);
        vector<Object> args;
        Int k = w + 1;
        for (Int i = 0; i < n; i++) {
            Int j = k + i;
            args.push_back(exportTerm(heap[size_t(j)]));
        }
        return args;
    }
    default:
        throw logic_error(cstr("*BAD TERM*") + showCell(x));
    }
}

string Engine::showCell(Int w) {
    Int t = tagOf(w);
    Int val = detag(w);
    string s;
    switch (t) {
    case V:
        s = cstr("v:") + val;
        break;
    case U:
        s = cstr("u:") + val;
        break;
    case N:
        s = cstr("n:") + val;
        break;
    case C:
        s = cstr("c:") + getSym(val);
        break;
    case R:
        s = cstr("r:") + val;
        break;
    case A:
        s = cstr("a:") + val;
        break;
    default:
        s = cstr("*BAD*=") + w;
    }
    return s;
}

IntS Engine::toNums(vector<Clause> clauses)
{
    IntS r(Int(clauses.size()));
    iota(r.begin(), r.end(), 0);
    return r;
}

}