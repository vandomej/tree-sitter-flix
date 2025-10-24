pub def extractExt(): Char = {
//    let lastPart = String.takeWhileRight(c -> c != '/', filePath)
	let result = '/';
	result
}

//def main(): Unit = 
//  let regex1 = regex"hello";
//  let regex2 = regex"\\$";
//  let regex3 = regex"\t+\n";
//  let regex4 = regex"\\t\\n\\w+";
//  let regex5 = regex"\"";
//  let regex6 = regex"\\\\";
//  let regex7 = regex"\\x47";
//  let regex8 = regex"\\u00A9"
  
//def main(): List[Char] =
//  List#{'\\', '\n', '\r', '\t', '+', '%', '字', '\u5B57', '\''}

def main(): Bool =
	match (Some(20)) {
		case Some(x) if x > 10 => true
		case _ => false
	}
