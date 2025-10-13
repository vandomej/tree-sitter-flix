// Precedence rules. Its much easier to have them grouped like this.
const PREC = {
  type_function: 2,
  type_identifier: 1,

  call: 21,
  field: 20,
  deref: 19,
  group: 18,
  unary: 17,
  user_defined_op: 16,
  infix_function: 15,
  composition: 14,
  multiply: 13,
  add: 12,
  bitwise_shift: 11,
  comparison: 10,
  equality: 9,
  bitwise_and: 8,
  bitwise_xor: 7,
  bitwise_or: 6,
  and: 5,
  or: 4,
  cons: 3,
  append: 2,
  assign: 1,
  effects: 1,
  pattern_constructor: -1,
};

const one_or_more_by = (item, sep) =>
  seq(repeat(seq(item, sep)), item);
const zero_or_more_by = (item, sep) =>
  optional(one_or_more_by(item, sep));
// Lists of items seperated by ','
const one_or_more = (item) =>
  one_or_more_by(item, ",");
const zero_or_more = (item) =>
  zero_or_more_by(item, ",");

const one_or_more_optionally_by = (
  item,
  sep,
) =>
  seq(
    repeat(seq(item, optional(sep))),
    item,
  );
const zero_or_more_optionally_by = (
  item,
  sep,
) =>
  optional(
    one_or_more_optionally_by(item, sep),
  );
// Lists of items optionally separated by ","
const one_or_more_optionally = (item) =>
  one_or_more_optionally_by(item, ",");
const zero_or_more_optionally = (item) =>
  zero_or_more_optionally_by(item, ",");

module.exports = grammar({
  name: "flix",

  extras: ($) => [/\s/, $.comment],

  supertypes: ($) => [
    $._expression,
    $._literal,
    $._declaration,
  ],

  word: ($) => $.name,

  rules: {
    program: ($) =>
      seq(
        repeat(seq($.use, optional(";"))),
        repeat($._declaration),
      ),

    _declaration: ($) =>
      choice(
        $.function_declaration,
        $.enum_declaration,
        $.module_declaration,
        $.type_alias_declaration,
        $.trait_declaration,
        $.trait_implementation,
        $.effect_declaration,
      ),

    //////// MODULES ////////////
    module_declaration: ($) =>
      seq(
        "mod",
        field("name", $._uppercase_name),
        field(
          "body",
          alias(
            $.module_body,
            $.declarations,
          ),
        ),
      ),
    module_body: ($) =>
      seq("{", repeat($._declaration), "}"),
    use: ($) => seq("use", $.use_path),
    use_path: ($) =>
      prec(
        PREC.field,
        seq(
          choice($._name, $.use_path),
          ".",
          choice($.use_set, $._name),
        ),
      ),
    use_set: ($) =>
      seq("{", zero_or_more($._name), "}"),

    //////// ENUMS //////////////
    enum_declaration: ($) =>
      seq(
        optional($.annotations),
        optional($.modifiers),
        "enum",
        field("name", $._uppercase_name),
        optional(
          field(
            "type_parameters",
            $.type_parameters,
          ),
        ),
        optional(
          field(
            "traits",
            seq(
              "with",
              one_or_more(
                alias(
                  $.uppercase_name,
                  $.trait,
                ),
              ),
            ),
          ),
        ),
        field(
          "constructors",
          $.constructors,
        ),
      ),

    constructors: ($) =>
      seq(
        "{",
        one_or_more_optionally(
          $.constructor,
        ),
        "}",
      ),
    constructor: ($) =>
      seq(
        "case",
        $._uppercase_name,
        optional(
          field(
            "parameters",
            $.constructor_parameters,
          ),
        ),
      ),
    constructor_parameters: ($) =>
      seq("(", one_or_more($._type), ")"),

    //////// FUNCTIONS //////////
    function_declaration: ($) =>
      seq(
        $._function_definition,
        "=",
        field("body", $._stmt),
      ),
    function_definition: ($) =>
      $._function_definition,
    _function_definition: ($) =>
      seq(
        optional($.annotations),
        optional($.modifiers),
        "def",
        field(
          "name",
          choice(
            $._lowercase_name,
            $._operator_name,
          ),
        ),
        optional(
          field(
            "type_parameters",
            $.type_parameters,
          ),
        ),
        field("parameters", $.parameters),
        optional(
          seq(
            ":",
            field("return_type", $._type),
          ),
        ),
        optional(
          seq(
            "\\",
            field("effects", $._effects),
          ),
        ),
      ),

    parameters: ($) =>
      seq(
        "(",
        zero_or_more($.parameter),
        ")",
      ),
    parameter: ($) =>
      seq(
        field("name", $._lowercase_name),
        ":",
        field("type", $._type),
      ),

    /////// EFFECTS ///////
    _effects: ($) =>
      choice($.effects, $._effect),
    effects: ($) =>
      prec(
        PREC.effects,
        choice(
          seq(
            "{",
            zero_or_more($._effect),
            "}",
          ),
          $._effect_group,
        ),
      ),
    _effect: ($) =>
      choice(
        alias($.uppercase_name, $.effect),
        alias(
          $.lowercase_name,
          $.polymorphic_effect,
        ),
        $._effect_unary,
        alias($._effect_binary, $.binary),
        $._effect_group,
      ),
    _effect_unary: ($) =>
      prec(PREC.unary, seq("~", $._effect)),
    _effect_binary: ($) =>
      prec.left(
        seq(
          $._effect,
          alias(
            choice("+", "-", "&"),
            $.operator,
          ),
          $._effect,
        ),
      ),
    _effect_group: ($) =>
      seq("(", $._effect, ")"),
    _effect_binary_operators: ($) =>
      /[\+\-&]/,
    effect_declaration: ($) =>
      seq(
        "eff",
        field("effect", $._uppercase_name),
        "{",
        field(
          "body",
          one_or_more($.function_definition),
        ),
        "}",
      ),
    effect_block: ($) =>
      seq(
        "run",
        "{",
        $._stmt,
        "}",
        repeat1($.effect_handler),
      ),
    effect_handler: ($) =>
      seq(
        token("with handler"),
        field("effect", $._uppercase_name),
        "{",
        repeat1(
          alias(
            $._effect_function,
            $.function_declaration,
          ),
        ),
        "}",
      ),
    _effect_function: ($) =>
      seq(
        $._effect_function_definition,
        "=",
        field("body", $._stmt),
      ),
    _effect_function_definition: ($) =>
      seq(
        "def",
        field(
          "name",
          choice(
            $._lowercase_name,
            $._operator_name,
          ),
        ),
        field(
          "parameters",
          alias(
            $.implementation_parameters,
            $.parameters,
          ),
        ),
      ),
    implementation_parameters: ($) =>
      seq(
        "(",
        zero_or_more(
          alias(
            $.implementation_parameter,
            $.parameter,
          ),
        ),
        ")",
      ),
    implementation_parameter: ($) =>
      choice(
        $._lowercase_name,
        seq(optional("_"), "resume"),
        "_",
      ),

    /////// TYPE PARAMETERS ///////
    type_parameters: ($) =>
      seq(
        "[",
        zero_or_more($.type_parameter),
        "]",
      ),
    type_parameter: ($) =>
      seq(
        field("name", $._lowercase_name),
        optional(
          seq(":", field("kind", $.kind)),
        ),
      ),
    kind: ($) =>
      choice(
        "Type",
        "RecordRow",
        "SchemaRow",
      ),

    /////// ANNOTATIONS ///////
    annotations: ($) =>
      repeat1($.annotation),
    annotation: ($) =>
      /@[a-zA-Z][a-zA-Z0-9_]*/,

    /////// EXPRESSIONS ///////
    _stmt: ($) =>
      seq(
        optional(seq($._stmt, ";")),
        $._expression,
      ),
    _expression: ($) =>
      choice(
        $._literal,
        $._lowercase_name,
        $.block,
        $.if,
        $.match,
        $.for_monadic,
        $.for_applicative,
        $.foreach,
        $.let,
        $.field,
        $.ref,
        $.deref,
        $.assign,
        $.region,
        $.unary,
        $.binary,
        $.group,
        $.call_expression,
        $.tuple,
        $.effect_block,
      ),
    call_expression: ($) =>
      prec(
        PREC.call,
        seq(
          field(
            "function",
            choice(
              $._lowercase_name,
              $._uppercase_name,
              $.field,
              $.group,
              $.call_expression,
            ),
          ),
          field("arguments", $.arguments),
        ),
      ),
    arguments: ($) =>
      seq(
        "(",
        zero_or_more($._expression),
        ")",
      ),

    ///////// CONTROL STRUCTURES /////////////
    for_applicative: ($) =>
      seq(
        "forA",
        "(",
        zero_or_more_by(
          choice($.gets, $.filter),
          ";",
        ),
        ")",
        "yield",
        $._expression,
      ),
    for_monadic: ($) =>
      seq(
        "forM",
        "(",
        zero_or_more_by(
          choice($.gets, $.filter),
          ";",
        ),
        ")",
        "yield",
        $._expression,
      ),
    foreach: ($) =>
      seq(
        "foreach",
        "(",
        zero_or_more_by(
          choice($.gets, $.filter),
          ";",
        ),
        ")",
        $._foreach_body,
      ),
    _foreach_body: ($) =>
      choice(
        seq("yield", $._expression),
        $._expression,
      ),
    gets: ($) =>
      seq(
        $._lowercase_name,
        "<-",
        $._expression,
      ),
    filter: ($) => seq("if", $._expression),
    if: ($) =>
      seq(
        "if",
        "(",
        $._expression,
        ")",
        $._expression,
        "else",
        $._expression,
      ),
    match: ($) =>
      seq(
        "match",
        $._expression,
        choice(
          $._match_scoped,
          $._match_lambda,
        ),
      ),
    _match_lambda: ($) =>
      seq("->", $._expression),
    _match_scoped: ($) =>
      seq(
        "{",
        repeat(alias($.match_case, $.case)),
        "}",
      ),
    match_case: ($) =>
      seq(
        "case",
        field("pattern", $._pattern_cons),
        "=>",
        field("expression", $._expression),
      ),
    _pattern_cons: ($) =>
      seq(
        $._pattern,
        optional(seq("::", $._pattern)),
      ),
    _pattern: ($) =>
      choice(
        "_",
        $._literal,
        $._lowercase_name,
        $._uppercase_name,
        alias(
          $.pattern_constructor,
          $.constructor,
        ),
        alias($._pattern_tuple, $.tuple),
      ),
    pattern_constructor: ($) =>
      prec(
        PREC.pattern_constructor,
        seq(
          choice(
            $._lowercase_name,
            $._uppercase_name,
            $.field,
          ),
          optional($._pattern_tuple),
        ),
      ),
    _pattern_tuple: ($) =>
      seq(
        "(",
        zero_or_more($._pattern),
        ")",
      ),

    ///////////// 'SIMPLE' EXPRESSIONS ////////////
    tuple: ($) =>
      seq(
        "(",
        one_or_more($._expression),
        ")",
      ),
    block: ($) => seq("{", $._stmt, "}"),
    field: ($) =>
      prec(
        PREC.field,
        seq(
          choice(
            $._lowercase_name,
            $._uppercase_name,
            $.field,
          ),
          ".",
          $._name,
        ),
      ),
    ref: ($) =>
      seq(
        "ref",
        $._expression,
        "@",
        $._lowercase_name,
      ),
    deref: ($) =>
      prec(
        PREC.deref,
        seq("deref", $._expression),
      ),
    assign: ($) =>
      prec.left(
        PREC.assign,
        seq(
          $._expression,
          ":=",
          $._expression,
        ),
      ),
    region: ($) =>
      seq(
        "region",
        field("name", $._lowercase_name),
        "{",
        field("body", $._stmt),
        "}",
      ),
    let: ($) =>
      seq(
        "let",
        $._pattern,
        optional(seq(":", $._type)),
        "=",
        $._expression,
      ),

    /////////// OPERATORS /////////////
    unary: ($) =>
      prec(
        PREC.unary,
        choice(
          seq("-", $._expression),
          seq("+", $._expression),
          seq("not", $._expression),
          seq("~~~", $._expression),
        ),
      ),
    binary: ($) =>
      choice(
        prec.left(
          PREC.user_defined_op,
          seq(
            $._expression,
            alias(
              $.operator_name,
              $.user_operator,
            ),
            $._expression,
          ),
        ),
        prec.left(
          PREC.composition,
          seq(
            $._expression,
            "<+>",
            $._expression,
          ),
        ),
        prec.left(
          PREC.infix_function,
          seq(
            $._expression,
            $.infix_function,
            $._expression,
          ),
        ),
        prec.left(
          PREC.or,
          seq(
            $._expression,
            "or",
            $._expression,
          ),
        ),
        prec.left(
          PREC.and,
          seq(
            $._expression,
            "and",
            $._expression,
          ),
        ),
        prec.left(
          PREC.bitwise_or,
          seq(
            $._expression,
            "|||",
            $._expression,
          ),
        ),
        prec.left(
          PREC.bitwise_xor,
          seq(
            $._expression,
            "^^^",
            $._expression,
          ),
        ),
        prec.left(
          PREC.bitwise_and,
          seq(
            $._expression,
            "&&&",
            $._expression,
          ),
        ),
        prec.left(
          PREC.equality,
          seq(
            $._expression,
            choice("==", "!=", "<=>"),
            $._expression,
          ),
        ),
        prec.left(
          PREC.comparison,
          seq(
            $._expression,
            choice("<=", ">=", "<", ">"),
            $._expression,
          ),
        ),
        prec.left(
          PREC.bitwise_shift,
          seq(
            $._expression,
            choice(">>>", "<<<"),
            $._expression,
          ),
        ),
        prec.left(
          PREC.multiply,
          seq(
            $._expression,
            choice(
              "**",
              "*",
              "/",
              "mod",
              "rem",
            ),
            $._expression,
          ),
        ),
        prec.left(
          PREC.add,
          seq(
            $._expression,
            choice("+", "-"),
            $._expression,
          ),
        ),
        prec.left(
          PREC.cons,
          seq(
            $._expression,
            "::",
            $._expression,
          ),
        ),
        prec.left(
          PREC.append,
          seq(
            $._expression,
            ":::",
            $._expression,
          ),
        ),
      ),
    group: ($) =>
      prec(
        PREC.group,
        seq("(", $._expression, ")"),
      ),
    infix_function: ($) =>
      seq("`", $._lowercase_name, "`"),

    /////// TYPES /////////
    _type: ($) =>
      choice(
        $.type_primitive,
        $.type_tuple,
        $.type_function,
        $.type_record,
        $._type_identifier,
      ),
    type_primitive: ($) =>
      seq(
        $._type_primitive,
        optional($.type_arguments),
      ),
    _type_primitive: ($) =>
      choice(
        "Unit",
        "Bool",
        "Char",
        "Float32",
        "Float64",
        "Int8",
        "Int16",
        "Int32",
        "Int64",
        "String",
        "BigInt",
        "BigDecimal",
        "Region",
        "Void",
      ),
    _type_identifier: ($) =>
      choice(
        alias(
          $.lowercase_name,
          $.polymorphic_identifier,
        ),
        $.type,
      ),
    type: ($) =>
      seq(
        $._uppercase_name,
        optional($.type_arguments),
      ),
    type_arguments: ($) =>
      seq("[", one_or_more($._type), "]"),
    type_tuple: ($) =>
      seq("(", one_or_more($._type), ")"),
    type_function: ($) =>
      prec.left(
        PREC.type_function,
        seq(
          field("parameters", $._type),
          "->",
          field("return_type", $._type),
          optional(
            seq(
              "\\",
              field("effects", $._effects),
            ),
          ),
        ),
      ),
    type_record: ($) =>
      seq(
        "{",
        zero_or_more($.type_record_item),
        optional(
          seq("|", $._lowercase_name),
        ),
        "}",
      ),
    type_record_item: ($) =>
      seq($._lowercase_name, "=", $._type),
    type_alias_declaration: ($) =>
      seq(
        token("type alias"),
        $._type,
        "=",
        $._type,
      ),
    trait_declaration: ($) =>
      seq(
        optional($.modifiers),
        "trait",
        field("trait", $.type),
        "{",
        field(
          "body",
          one_or_more($.function_definition),
        ),
        "}",
      ),
    trait_implementation: ($) =>
      seq(
        "instance",
        field("type", $.type),
        "with",
        field("trait", $.type),
        "{",
        field(
          "body",
          one_or_more(
            $.function_declaration,
          ),
        ),
        "}",
      ),

    /////// COMMENTS ////////////
    // TODO: Doc and block comments
    comment: ($) => $.line_comment,
    line_comment: ($) =>
      token(seq("//", /.*/)),

    /////// LITERALS //////////
    // TODO: interpreted strings
    _literal: ($) =>
      choice(
        $.nil,
        $.none,
        $.unit,
        $.integer,
        $.float,
        $.boolean,
        $.char,
        $.string,
        $.list,
        $.vector,
        $.set,
        $.map,
        $.record,
      ),
    nil: ($) => /Nil/,
    none: ($) => /None/,
    unit: ($) => prec(100, seq("(", ")")),
    integer: ($) =>
      /\d+(i8|i16|i32|i64|ii)?/,
    float: ($) => /\d+\.\d+(f32|f64|ff)?/,
    boolean: ($) => choice("true", "false"),
    char: ($) => /'[a-zA-Z]'/,
    string: ($) =>
      seq(
        '"',
        repeat(
          choice(
            $._string_fragment,
            $._escape_sequence,
          ),
        ),
        '"',
      ),
    list: ($) =>
      seq(
        "List#",
        "{",
        zero_or_more($._expression),
        "}",
      ),
    vector: ($) =>
      seq(
        "Vector#",
        "{",
        zero_or_more($._expression),
        "}",
      ),
    set: ($) =>
      seq(
        "Set#",
        "{",
        zero_or_more($._expression),
        "}",
      ),
    array: ($) =>
      seq(
        "Array#",
        "{",
        zero_or_more($._expression),
        "}",
        "@",
        $._lowercase_name,
      ),
    map: ($) =>
      seq(
        "Map#",
        "{",
        zero_or_more($.map_item),
        "}",
      ),
    map_item: ($) =>
      seq(
        $._expression,
        "=>",
        $._expression,
      ),
    record: ($) =>
      seq(
        "{",
        zero_or_more($.record_item),
        optional(
          seq("|", $._lowercase_name),
        ),
        "}",
      ),
    // TODO: This prec should be something sensible
    record_item: ($) =>
      prec(
        100,
        choice(
          seq("-", $._lowercase_name),
          seq(
            optional("+"),
            $._lowercase_name,
            "=",
            $._expression,
          ),
        ),
      ),

    // Workaround to https://github.com/tree-sitter/tree-sitter/issues/1156
    // We give names to the token_ constructs containing a regexp
    // so as to obtain a node in the CST.
    _string_fragment: (_) =>
      token.immediate(prec(1, /[^"\\]+/)),
    _escape_sequence: ($) =>
      choice(
        prec(
          2,
          token.immediate(
            seq("\\", /[^abfnrtvxu'\"\\\?]/),
          ),
        ),
        prec(1, $.escape_sequence),
      ),
    escape_sequence: (_) =>
      token.immediate(
        seq(
          "\\",
          choice(
            /[^xu0-7]/,
            /[0-7]{1,3}/,
            /x[0-9a-fA-F]{2}/,
            /u[0-9a-fA-F]{4}/,
            /u\{[0-9a-fA-F]+\}/,
          ),
        ),
      ),

    modifiers: ($) => repeat1($.modifier),
    modifier: ($) =>
      choice(
        "pub",
        "inline",
        "lawful",
        "opaque",
        "override",
        "sealed",
      ),

    /////// NAMES ////////
    uppercase_name: ($) =>
      /_?[A-Z][a-zA-Z0-9_]*/,
    lowercase_name: ($) =>
      /_?[a-z][a-zA-Z0-9_]*/,
    name: ($) => /[a-zA-Z][a-zA-Z0-9_]*/,
    _uppercase_name: ($) =>
      alias($.uppercase_name, $.identifier),
    _lowercase_name: ($) =>
      alias($.lowercase_name, $.identifier),
    _name: ($) =>
      alias($.name, $.identifier),
    _operator_name: ($) =>
      alias($.operator_name, $.identifier),
    operator_name: ($) =>
      /[\+\-\*<>=!&|\^\$][\+\-\*<>=!&|\^\$]+/,
    // TODO: Not sure how to support greek and math names
  },
});
