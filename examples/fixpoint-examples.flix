
def isConnected(s: Set[(Int32, Int32)], src: Int32, dst: Int32): Bool =
    let rules = #{
        Path(x, y) :- Edge(x, y).
        Path(x, z) :- Path(x, y), Edge(y, z).
    };
    let edges = inject s into Edge/2;
    let paths = query edges, rules select true from Path(src, dst);
    not (paths |> Vector.isEmpty)

def main(): Unit \ IO =
    let s = Set#{(1, 2), (2, 3), (3, 4), (4, 5)};
    let src = 1;
    let dst = 5;
    if (isConnected(s, src, dst)) {
        println("Found a path between ${src} and ${dst}!")
    } else {
        println("Did not find a path between ${src} and ${dst}!")
    }





//def getParents(): #{ ParentOf(String, String) | r } = #{
//    ParentOf("Pompey", "Strabo").
//    ParentOf("Gnaeus", "Pompey").
//    ParentOf("Pompeia", "Pompey").
//    ParentOf("Sextus", "Pompey").
//}
//
//def getAdoptions(): #{ AdoptedBy(String, String) | r } = #{
//    AdoptedBy("Augustus", "Caesar").
//    AdoptedBy("Tiberius", "Augustus").
//}
//
//def withAncestors(): #{ ParentOf(String, String),
//                        AncestorOf(String, String) | r } = #{
//        AncestorOf(x, y) :- ParentOf(x, y).
//        AncestorOf(x, z) :- AncestorOf(x, y), AncestorOf(y, z).
//}
//
//def withAdoptions(): #{ AdoptedBy(String, String),
//                        AncestorOf(String, String) | r } = #{
//    AncestorOf(x, y) :- AdoptedBy(x, y).
//}
//
//def main(): Unit \ IO =
//    let c = false;
//    if (c) {
//        query getParents(), getAdoptions(), withAncestors()
//            select (x, y) from AncestorOf(x, y) |> println
//    } else {
//        query getParents(), getAdoptions(), withAncestors(), withAdoptions()
//            select (x, y) from AncestorOf(x, y) |> println
//    }
//
//
//
//
//
//def edgesWithNumbers(): #{ LabelledEdge(String, Int32 , String) | r } = #{
//    LabelledEdge("a", 1, "b").
//    LabelledEdge("b", 1, "c").
//    LabelledEdge("c", 2, "d").
//}
//
//def edgesWithColor(): #{ LabelledEdge(String, String, String) | r } = #{
//    LabelledEdge("a", "red", "b").
//    LabelledEdge("b", "red", "c").
//    LabelledEdge("c", "blu", "d").
//}
//
//def closure(): #{ LabelledEdge(String, l, String),
//                  LabelledPath(String, l, String) } with Order[l] = #{
//    LabelledPath(x, l, y) :- LabelledEdge(x, l, y).
//    LabelledPath(x, l, z) :- LabelledPath(x, l, y), LabelledPath(y, l, z).
//}
//
//def main(): Unit \ IO =
//    query edgesWithNumbers(), closure()
//        select (x, l, z) from LabelledPath(x, l, z) |> println;
//    query edgesWithColor(), closure()
//        select (x, l, z) from LabelledPath(x, l, z) |> println
//
//
//
//
//
//def main(): Unit \ IO =
//	let names = "Lucky Luke" :: "Luke Skywalker" :: Nil;
//	let jedis = "Luke Skywalker" :: Nil;
//	let p = inject names, jedis into Name/1, Jedi/1
//
//
//
//
//
//def main(): Unit \ IO =
//    let f1 = #{
//        ColorEdge(1, "blue", 2).
//        ColorEdge(2, "blue", 3).
//        ColorEdge(3, "red", 4).
//    };
//    let r1 = #{
//        ColorPath(x, c, y) :- ColorEdge(x, c, y).
//        ColorPath(x, c, z) :- ColorPath(x, c, y), ColorEdge(y, c, z).
//    };
//    let r2 = #{
//        ColorlessPath(x, y) :- ColorPath(x, _, y).
//    };
//    let m = solve f1, r1 project ColorPath;
//    query m, r2 select (x, y) from ColorlessPath(x, y) |> println
//
//
//
//
//
//def main(): Unit \ IO =
//    let movies = #{
//        Movie("The Hateful Eight").
//        Movie("Interstellar").
//    };
//    let actors = #{
//        StarringIn("The Hateful Eight", "Samuel L. Jackson").
//        StarringIn("The Hateful Eight", "Kurt Russel").
//        StarringIn("The Hateful Eight", "Quentin Tarantino").
//        StarringIn("Interstellar", "Matthew McConaughey").
//        StarringIn("Interstellar", "Anne Hathaway").
//    };
//    let directors = #{
//        DirectedBy("The Hateful Eight", "Quentin Tarantino").
//        DirectedBy("Interstellar", "Christopher Nolan").
//    };
//    let rule = #{
//        MovieWithoutDirector(title) :-
//            Movie(title),
//            DirectedBy(title, name),
//            not StarringIn(title, name).
//    };
//    query movies, actors, directors, rule
//        select title from MovieWithoutDirector(title) |> println
//
//
//
//
//
//def cyclic(): #{Edge(Int32, Int32), Path(Int32, Int32), Cyclic()} = #{
//    Path(x, y) :- Edge(x, y).
//    Path(x, z) :- Path(x, y), Edge(y, z).
//    Cyclic() :- Path(x, x).
//}
//
//def main(): Unit \ IO = 
//    let db = #{
//        Edge(1, 2).
//        Edge(2, 3).
//        Edge(3, 1).
//    };
//    query db, cyclic() select true from Cyclic() |> println
//
//
//
//
//
//def primesInRange(b: Int32, e: Int32): Vector[Int32] = 
//    Vector.range(b, e) |> Vector.filter(isPrime)
//
//
//
//
//
//
//use D.D;
//
//pub enum D with Eq, Order, ToString {
//    case D(Int32)
//}
//
//instance PartialOrder[D] {
//    pub def lessEqual(x: D, y: D): Bool =
//        let D(n1) = x;
//        let D(n2) = y;
//        n1 >= n2        // Note: Order reversed.
//}
//
//instance LowerBound[D] {
//    // Note: Because the order is reversed, the largest value is the smallest.
//    pub def minValue(): D = D(Int32.maxValue())
//}
//
//instance UpperBound[D] {
//    // Note: Because the order is reversed, the smallest value is the largest.
//    pub def maxValue(): D = D(Int32.minValue())
//}
//
//instance JoinLattice[D] {
//    pub def leastUpperBound(x: D, y: D): D =
//        let D(n1) = x;
//        let D(n2) = y;
//        D(Int32.min(n1, n2))        // Note: Order reversed.
//}
//
//instance MeetLattice[D] {
//    pub def greatestLowerBound(x: D, y: D): D =
//        let D(n1) = x;
//        let D(n2) = y;
//        D(Int32.max(n1, n2))        // Note: Order reversed.
//}
//
//def shortestPath(g: Set[(t, Int32, t)], o: t): Map[t, D] with Order[t] =
//    let db = inject g into Edge/3;
//    let pr = #{
//        Dist(o; D(0)).
//        Dist(y; add(d1 , D(d2))) :- Dist(x; d1), Edge(x, d2, y).
//    };
//    query db, pr select (x , d) from Dist(x; d) |> Vector.toMap
//
//def add(x: D, y: D): D =
//    let D(n1) = x;
//    let D(n2) = y;
//    D(n1 + n2)
//
//def main(): Unit \ IO =
//    let g = Set#{
//        ("Aarhus", 200, "Flensburg"),
//        ("Flensburg", 150, "Hamburg")
//    };
//    println(shortestPath(g, "Aarhus"))
//
