def main(): Unit \ IO =
    let f1 = #{
        ColorEdge(1, "blue", 2).
        ColorEdge(2, "blue", 3).
        ColorEdge(3, "red", 4).
    };
    let r1 = #{
        ColorPath(x, c, y) :- ColorEdge(x, c, y).
        ColorPath(x, c, z) :- ColorPath(x, c, y), ColorEdge(y, c, z).
    };
    let r2 = #{
        ColorlessPath(x, y) :- ColorPath(x, _, y).
    };
    let m = solve f1, r1 project ColorPath;
    query m, r2 select (x, y) from ColorlessPath(x, y) |> println
