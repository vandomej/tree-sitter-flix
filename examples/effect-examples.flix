//def ->>(f: a -> b \ ef1, g: b -> c \ ef2): a -> c \ ((ef1 + ef2 + (ef1 + ef2))) = x -> g(f(x))
//
//def foo(a: Int32): Bool = if (a == 0) false else true
//
//def bar(b: Bool): String = if (b == true) "True" else "False"
//
//def main(): Unit \ IO =
//	println((foo ->> bar)(1))

//eff DivByZero {
//    def divByZero(): Void
//}
//
//def divide(x: Int32, y: Int32): Int32 \ DivByZero = 
//    if (y == 0) {
//        DivByZero.divByZero()
//    } else {
//        x / y
//    }
//
//def main(): Unit \ IO = 
//    run {
//        println(divide(3, 2));
//        println(divide(3, 0))
//    } with handler DivByZero {
//        def divByZero(_resume) = println("Oops: Division by Zero!")
//    }

//eff Ask {
//    def ask(): String
//}
//
//eff Say {
//    def say(s: String): Unit
//}
//
//def greeting(): Unit \ {Ask, Say} = 
//    let name = Ask.ask();
//    Say.say("Hello Mr. ${name}")
//
//def main(): Unit \ IO = 
//    run {
//        greeting()
//    } with handler Ask {
//        def ask(_, resume) = resume("Bond, James Bond")
//    } with handler Say {
//        def say(s, resume) = { println(s); resume() }
//    }




//eff Amb {
//    def flip(): Bool
//}
//
//eff Exc {
//    def raise(m: String): Void
//}
//
//def drunkFlip(): String \ {Amb, Exc} = {
//    if (Amb.flip()) {
//        let heads = Amb.flip();
//        if (heads) "heads" else "tails"
//    } else {
//        Exc.raise("too drunk to flip")
//    }
//}
//
//def handleAmb(f: a -> b \ ef): a -> List[b] \ ef - Amb =  
//    x -> run {
//        f(x) :: Nil
//    } with handler Amb {
//        def flip(_, resume) = resume(true) ::: resume(false)
//    }
//
//def handleExc(f: a -> b \ ef): a -> Option[b] \ ef - Exc = 
//    x -> run {
//        Some(f(x))
//    } with handler Exc {
//        def raise(_, _) = None
//    }
//
//
//def main(): Unit \ IO = {
//    // Prints: Some(heads) :: Some(tails) :: None :: Nil
//    handleAmb(handleExc(drunkFlip))() |> println;
//
//    // Prints: None
//    handleExc(handleAmb(drunkFlip))() |> println
//}





//eff Amb {
//    def flip(): Bool
//}

//def runWithIO(f: Unit -> a \ ef): a \ (ef - {Amb} + IO) =
//def runWithIO(f: Unit -> a \ ef): a \ {ef - (Amb) + IO} =
//def runWithIO(f: Unit -> a \ ef): a \ {{ef - (Amb) + IO}} =
//    run {
//        f()    
//    } with handler Amb {
//        def flip(resume) = resume(true)
//    }
//
def main(): Unit \ IO =
    run {
        let result = Amb.flip();
        println("You flipped: ${result}")
    } with runWithIO

//def effectsWeird(f: Unit -> a \ ef1, g: a -> b \ ef2): b \ {{ef1 + ef2}, (IO + (~ef1 - ~ef2))} =
//    println("IO usage");
//    g(f())
//
//def effectsWeird2(f: Unit -> a \ ef1, g: a -> b \ ef2): b \ {{ef1 + ef2}, {IO, (~ef1 - ~ef2)}} =
//    println("IO usage");
//    g(f())
//
//def effectsWeird3(f: Unit -> a \ ef1, g: a -> b \ ef2): b \ ef1 + ef2 =
//    g(f())
    
def main(): Unit \ IO =
    run {
        let timestamp = Clock.currentTime(TimeUnit.Milliseconds);
        println("${timestamp} ms since the epoc")
    } with Clock.runWithIO
