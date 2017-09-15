
/**
Dynamic Stack for int data.
*/

// Original code by Paul Tarau. Ported by CapelliC.

const MINSIZE = 1 << 6 // power of 2

class IntStack {

    constructor(size = 8) {
        this.stack = new Int32Array(size)
        this.top = -1
    }

    getTop() {
        return this.top
    }

    setTop(top) {
        return this.top = top
    }

    clear() {
        this.top = -1
    }

    isEmpty() {
        return this.top < 0
    }

    /**
    Pushes an element - top is incremented first than the
     element is assigned. This means top point to the last assigned
     element - which can be returned with peek().
    */
    push(i) {
        if (++this.top >= this.stack.length)
            this.expand()
        this.stack[this.top] = i
    }

    pop() {
        let r = this.stack[this.top--]
        shrink()
        return r
    }

    get(i) {
        return this.stack[i]
    }

    set(i, val) {
        this.stack[i] = val
    }

    size() {
        return top + 1;
    }

    /**
     dynamic array operation: doubles when full
    */
    expand() {
        let l = this.stack.length
        let newstack = new Int32Array(l << 1)
        newstack.set(this.stack)
        this.stack = newstack
    }

    /**
     dynamic array operation: shrinks to 1/2 if more than than 3/4 empty
    */
    shrink() {
        let l = this.stack.length
        if (l <= MINSIZE || this.top << 2 >= l)
            return
        l = 1 + (this.top << 1) // still means shrink to at 1/2 or less of the heap
        if (this.top < MINSIZE)
            l = MINSIZE

        let newstack = new Int32Array(l)
        newstack.set(this.stack.slice(0, this.top + 1))
        this.stack = newstack
    }

    toArray() {
        return this.stack.slice(0, this.top + 1)
    }

    reverse() {
        let s = this.stack
        s.set(s.slice(0, this.top + 1).reverse())
    }

    toString() {
        return JSON.stringify({
            name: 'IntStack',
            top: this.top,
            dim: this.stack.length,
            data: this.toArray().join(','),
        })
    }
}

function test() {
    let s = new IntStack()
    console.log('s0', s.toString())
    
    for (let i = 0; i < 4; ++i)
        s.push(i + 1)
    console.log('s1', s.toString())

    s.reverse()
    console.log('s2', s.toString())

    for (let i = 0; i < 10; ++i)
        s.push(10 + i + 1)
    console.log('s3', s.toString())
}
test()
