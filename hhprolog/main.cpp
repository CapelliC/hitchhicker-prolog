/*
Description: hitchhicker Prolog

Original Java code by Paul Tarau.
The reference document: http://www.cse.unt.edu/~tarau/research/2017/eng.pdf

Author: Carlo Capelli
Version: 1.0.0
License: MIT
Copyright (c) 2018 Carlo Capelli
*/

#include <iostream>
#include "hhprolog.h"
#include "file2string.h"

using namespace std;

int main(int argc, char *argv[])
{
    try {
        string path = "/home/carlo/test/java/prologEngine/progs/",
            fname = argc == 1 ? "perms.pl" : argv[1],
            src = file2string(path + fname + ".nl"); // assume SWI-Prolog already takes care of .pl => .pl.nl
        auto p = new hhprolog::Prog(src);
        p->ppCode();
        p->run(true);
        delete p;
    }
    catch(exception &e) {
        cout << e.what() << endl;
    }
    return 0;
}
