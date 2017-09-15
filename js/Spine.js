
/**
 * runtime representation of an immutable list of goals
 * together with top of heap and trail pointers
 * and current clause tried out by head goal
 * as well as registers associated to it
 *
 * note that parts of this immutable lists
 * are shared among alternative branches
 */

// Original code by Paul Tarau. Ported by CapelliC.

exports.Spine = (gs0, base, gs, ttop, k, cs) => {
    if (gs) // && ttop && ...
        /** creates a spine - as a snapshot of some runtime elements */
        return {
            hd      : gs0[0],
            base    : base,
            gs      : gs0.concat(gs).slice(1), // prepends the goals of clause with head hs
            ttop    : ttop,
            k       : k,
            cs      : cs,
            xs      : [],
        }
    else 
        /** creates a specialized spine returning an answer (with no goals left to solve) */
        return {
            hd      : gs0,   // head of the clause to which this corresponds
            base    : base,  // top of the heap when this was created
            gs      : [],    // goals - with the top one ready to unfold
            ttop    : ttop,  // top of the trail when this was created
            k       : -1,
            cs      : [],    // array of  clauses known to be unifiable with top goal in gs
            xs      : [],
        }
}
