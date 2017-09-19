
class IntList {

    constructor(X, Xs) {
        this.head = X
        this.tail = Xs
    }

    static isEmpty(Xs) {
        return null == Xs
    }

    static head(Xs) {
        return Xs.head
    }

    static tail(Xs) {
        return Xs.tail
    }

    static cons(X, Xs) {
        return new IntList(X, Xs)
    }

    static app(xs, Ys) {
        let Zs = Ys
        for (let i = xs.length - 1; i >= 0; i--) {
            Zs = IntList.cons(xs[i], Zs)
        }
        return Zs
    }

    static toInts(Xs) {
        let is = new IntStack()
        while (!isEmpty(Xs)) {
            is.push(head(Xs))
            Xs = IntList.tail(Xs)
        }
        return is
    }

    static len(Xs) {
        return IntList.toInts(Xs).length
    }

    toString() {
        return '['+ IntList.toInts(this).join(',') + ']'
    }
}

IntList.empty = null

exports.IntList = IntList
