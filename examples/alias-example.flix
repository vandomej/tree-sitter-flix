type alias M[k, v] = Map[k, Result[String, v]]

def foo(): M[Bool, Int32] = Map#{true => Ok(123)}
def main(): Unit \ IO =
    println("${Map.get(true, foo())}")
