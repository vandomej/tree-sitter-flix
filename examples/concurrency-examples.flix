
//def main(): Unit \ IO = region rc {
//    spawn println("Hello from thread") @ rc
//}






//def slowPrint(delay: Int32, message: String): Unit \ IO =
//    Thread.sleep(Time.Duration.fromSeconds(delay));
//    println(message)
//
//def main(): Unit \ IO =
//    region r1 {
//        region r2 {
//            spawn slowPrint(2, "Hello from r1") @ r1;
//            spawn slowPrint(1, "Hello from r2") @ r2
//        };
//        println("r2 is now complete")
//    };
//    println("r1 is now complete")
//
//
//
//
//
//
//def main(): Int32 \ {Chan, NonDet, IO} = region rc {
//    let (tx, rx) = Channel.unbuffered();
//    spawn Channel.send(42, tx) @ rc;
//    Channel.recv(rx)
//}
//
//
//
//

//def meow(tx: Sender[String]): Unit \ Chan =
//    Channel.send("Meow!", tx)
//
//def woof(tx: Sender[String]): Unit \ Chan =
//    Channel.send("Woof!", tx)
//
//def main(): Unit \ {Chan, NonDet, IO} = region rc {
//    let (tx1, rx1) = Channel.buffered(1);
//    let (tx2, rx2) = Channel.buffered(1);
//    spawn meow(tx1) @ rc;
//    spawn woof(tx2) @ rc;
//    select {
//        case m <- recv(rx1) => m
//        case m <- recv(rx2) => m
//    } |> println
//}
//
//
//
//

//def main(): String \ {Chan, NonDet} = region rc {
//    let (_, rx1) = Channel.buffered(1);
//    let (_, rx2) = Channel.buffered(1);
//    select {
//        case _ <- recv(rx1) => "one"
//        case _ <- recv(rx2) => "two"
//        case _             => "default"
//    }
//}

//
//
//
//
//def slow(tx: Sender[String]): Unit \ {Chan, IO} =
//    Thread.sleep(Time.Duration.fromSeconds(60));
//    Channel.send("I am very slow", tx)
//
//def main(): Unit \ {Chan, NonDet, IO} = region rc {
//    let (tx, rx) = Channel.buffered(1);
//    spawn slow(tx) @ rc;
//    let timeout = Channel.timeout(Time.Duration.fromSeconds(5));
//    select {
//        case m <- recv(rx)       => m
//        case _ <- recv(timeout)  => "timeout"
//    } |> println
//}
//
//
/////// PARALLELISM
//
//

def parMap(f: a -> b, l: List[a]): List[b] = match l {
    case Nil     => Nil
    case x :: xs =>
        par (r <- f(x); rs <- parMap(f, xs))
            yield r :: rs
}
