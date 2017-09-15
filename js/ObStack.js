class ObStack {
    constructor() {
        this.stack = []
    }
    pop() {
        return this.stack.pop()
    }
    push(O) {
        this.stack.push(O)
    }
    peek() {
        return this.stack[this.stack.size - 1]
    }
}
