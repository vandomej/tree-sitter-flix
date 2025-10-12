enum Shape with Eq, Order, ToString {
    case Circle(Int32),
    case Square(Int32),
    case Rectangle(Int32, Int32)
}

def main(): Unit \ IO =
    println("${Shape.Square(3)}")
