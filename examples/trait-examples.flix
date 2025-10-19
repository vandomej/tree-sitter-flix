//trait Equatable[t] {
//    pub def equals(x: t, y: t): Bool
//}
//
//instance Equatable[Option[t]] with Equatable[t] {
//    pub def equals(x: Option[t], y: Option[t]): Bool = 
//        match (x, y) {
//            case (None, None)         => true
//            case (Some(v1), Some(v2)) => Equatable.equals(v1, v2)
//            case _                    => false
//        }
//}

//// Type checks
//def sum(c: t): Int32 with Collection[t] where Collection.Elm[t] ~ Int32 = 
//    Collection.toList(c) |> List.sum
//
//trait Addable[t] {
//    type Rhs = t  // Associated type with default type.
//    pub def add(x: t, y: Addable.Rhs[t]): t
//}


//// Effects
//trait Dividable[t] {
//    type Aef: Eff
//    pub def div(x: t, y: t): t \ Dividable.Aef[t]
//}

instance Dividable[Float32] {
    type Aef = { Pure } // No exception, div-by-zero yields NaN.
    pub def div(x: Float32, y: Float32): Float32 = x / y
}

//instance Dividable[Int32] {
//    type Aef = { DivByZero }
//    pub def div(x: Int32, y: Int32): Int32 \ DivByZero = 
//        if (y == 0) DivByZero.raise() else x / y
//}



//// Region
//trait ForEach[t] {
//    type Elm
//    type Aef: Eff
//    pub def forEach(f: ForEach.Elm[t] -> Unit \ ef, x: t): Unit \ ef + ForEach.Aef[t]
//}
//
//instance ForEach[List[t]] {
//    type Elm = t
//    type Aef = { Pure }
//    pub def forEach(f: t -> Unit \ ef, x: List[t]): Unit \ ef = List.forEach(f, x)
//}
//
//instance ForEach[MutList[t, r]] {
//    type Elm = t
//    type Aef = { r }
//    pub def forEach(f: t -> Unit \ ef, x: MutList[t, r]): Unit \ ef + r = 
//        MutList.forEach(f, x)
//}
