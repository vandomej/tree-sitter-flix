//def ->>(f: a -> b \ ef1, g: b -> c \ ef2): a -> c \ ((ef1 + ef2 + (ef1 + ef2))) = x -> g(f(x))
//
//def foo(a: Int32): Bool = if (a == 0) false else true
//
//def bar(b: Bool): String = if (b == true) "True" else "False"
//
//def main(): Unit \ IO =
//	println((foo ->> bar)(1))

eff DivByZero {
    def divByZero(): Void
}

def divide(x: Int32, y: Int32): Int32 \ DivByZero = 
    if (y == 0) {
        DivByZero.divByZero()
    } else {
        x / y
    }

def main(): Unit \ IO = 
    run {
        println(divide(3, 2));
        println(divide(3, 0))
    } with handler DivByZero {
        def divByZero(_resume) = println("Oops: Division by Zero!")
    }
