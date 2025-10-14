def gameLoop(secret: Int32): Unit \ IO = {
    println("Enter a guess:");
    match readAndParseGuess() {
        case Result.Ok(g) => 
            if (secret == g) {
                println("Correct!")
            } else {
                println("Incorrect!");
                gameLoop(secret)
            }
        case Result.Err(_) => 
            println("Not a number? Goodbye.");
            println("The secret was: ${secret}")
    }
}
