# hitchhicker-prolog

Javascript porting - and some small rewriting - of Paul Tarau latest Prolog Engine architecture.

The reference document: http://www.cse.unt.edu/~tarau/research/2017/eng.pdf

---------

Some interesting properties, from the Abstract of the reference:

• the heap representation of terms and the abstract machine instruction encodings are the same
• no dedicated code area is used as the code is placed directly on the heap
• unification and indexing operations are orthogonal
• filtering of matching clauses happens without building new structures on the heap
• variables in function and predicate symbol positions are handled with no performance penalty
• a simple English-like syntax is used as an intermediate representation for clauses and goals
• the same English-like syntax can be used by programmers directly as an alternative to classic Prolog syntax
• solutions of (multiple) logic engines are exposed as answer streams that can be combined through typical functional programming patterns
• performance of a basic interpreter implementing our design is within a factor of 2 of a highly optimized WAM-based system

--------
