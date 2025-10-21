def cyclic(): #{Edge(Int32, Int32), Path(Int32, Int32), Cyclic()} = #{
    Path(x, y) :- Edge(x, y).
    Path(x, z) :- Path(x, y), Edge(y, z).
    Cyclic() :- Path(x, x).
}

def main(): Unit \ IO = 
    let db = #{
        Edge(1, 2).
        Edge(2, 3).
        //Edge(3, 1).
    };
    query db, cyclic() select true from Cyclic() |> println
