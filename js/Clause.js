
/**
 * representation of a clause
 */
 
// Original code by Paul Tarau. Ported by CapelliC.
 
exports.Clause = (len, hgs, base, neck, xs) => { return {
    hgs    : hgs,   // head+goals pointing to cells in cs
    base   : base,  // heap where this starts
    len    : len,   // length of heap slice
    neck   : neck,  // first after the end of the head
    xs     : xs,    // indexables in head
} }
