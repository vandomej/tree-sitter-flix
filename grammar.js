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
  lambda: -2,
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

  extras: ($) => [
    /\s/,
    $.comment,
    $.block_comment,
  ],

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
        $.enum_definition,
        $.module_declaration,
        $.type_alias_declaration,
        $.trait_definition,
        $.trait_implementation,
        $.effect_definition,
      ),

    //////// MODULES ////////////
    module_declaration: ($) =>
      seq(
        "mod",
        field("name", $._uppercase_name),
        field("body", $.declarations),
      ),
    declarations: ($) =>
      seq("{", repeat($._declaration), "}"),
    use: ($) =>
      seq(
        choice("use", "import"),
        $.use_path,
      ),
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
      seq(
        "{",
        zero_or_more(
          choice($._name, $.module_rename),
        ),
        "}",
      ),
    module_rename: ($) =>
      seq($._name, "=>", $._name),

    //////// ENUMS //////////////
    enum_definition: ($) =>
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
          field("traits", $.with_clause),
        ),
        field(
          "constructors",
          $.constructors,
        ),
      ),
    with_clause: ($) =>
      seq("with", one_or_more($._type)),
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
        field("body", $.expressions),
      ),
    function_definition: ($) =>
      $._function_definition,
    _function_definition: ($) =>
      seq(
        optional($.annotations),
        optional($.modifiers),
        "def",
        field("name", $._function_name),
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
          field(
            "with_clause",
            $.with_clause,
          ),
        ),
        optional(
          field(
            "where_clause",
            $.where_clause,
          ),
        ),
        optional(
          seq(
            "\\",
            field("effects", $.effects),
          ),
        ),
      ),
    where_clause: ($) =>
      seq(
        "where",
        field("type", $._type),
        "~",
        field("constraint", $._type),
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
    _typeless_parameters: ($) =>
      alias(
        $._typeless_parameters_inner,
        $.parameters,
      ),
    _typeless_parameters_inner: ($) =>
      seq(
        "(",
        zero_or_more($._typeless_parameter),
        ")",
      ),
    _typeless_parameter: ($) =>
      alias(
        $._typeless_parameter_inner,
        $.parameter,
      ),
    _typeless_parameter_inner: ($) =>
      choice($._name, $.ignored),
    arguments: ($) =>
      seq(
        "(",
        zero_or_more(
          choice($._expression, $.ignored),
        ),
        ")",
      ),

    /////// EFFECTS ///////
    effects: ($) =>
      prec(
        PREC.effects,
        one_or_more($._effect),
      ),
    _effect: ($) =>
      choice(
        alias(
          $.uppercase_name,
          $.identifier,
        ),
        alias(
          $.lowercase_name,
          $.polymorphic_identifier,
        ),
        $.effect_group,
        $.binary_effect,
        $.unary_effect,
        $.effect_field,
      ),
    effect_field: ($) =>
      seq(
        $._uppercase_name,
        ".",
        $._uppercase_name,
        $.type_arguments,
      ),
    unary_effect: ($) =>
      prec(PREC.unary, seq("~", $._effect)),
    binary_effect: ($) =>
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
    effect_group: ($) =>
      choice(
        seq(
          "{",
          one_or_more($._effect),
          "}",
        ),
        seq("(", $._effect, ")"),
      ),
    effect_definition: ($) =>
      seq(
        "eff",
        field("effect", $._uppercase_name),
        field(
          "body",
          alias(
            $._effect_template_body,
            $.template_body,
          ),
        ),
      ),
    _effect_template_body: ($) =>
      seq(
        "{",
        repeat($.function_definition),
        "}",
      ),
    effect_block: ($) =>
      seq(
        "run",
        $.block,
        repeat1($.effect_handler),
      ),
    effect_handler: ($) =>
      seq(
        "with",
        choice(
          seq(
            "handler",
            field(
              "effect",
              $._uppercase_name,
            ),
            field("body", $.handler_body),
          ),
          field(
            "effect",
            choice(
              $.field,
              $._lowercase_name,
            ),
          ),
        ),
      ),
    handler_body: ($) =>
      seq(
        "{",
        repeat1(
          alias(
            $._handler_function,
            $.function_declaration,
          ),
        ),
        "}",
      ),
    _handler_function: ($) =>
      seq(
        $._handler_function_definition,
        "=",
        field("body", $.expressions),
      ),
    _handler_function_definition: ($) =>
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
            $._handler_parameters,
            $.parameters,
          ),
        ),
      ),
    _handler_parameters: ($) =>
      seq(
        "(",
        zero_or_more($._handler_parameter),
        ")",
      ),
    _handler_parameter: ($) =>
      choice(
        $._lowercase_name,
        alias(
          seq(optional("_"), "resume"),
          $.resume,
        ),
        $.ignored,
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
    block: ($) => seq("{", $._stmt, "}"),
    expressions: ($) => prec(1, $._stmt),
    _expression_list: ($) =>
      one_or_more($._expression),
    _expression: ($) =>
      choice(
        $._literal,
        $._variable_name,
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
        $.object_constructor,
        $.tuple,
        $.effect_block,
        $.lambda,
        $.spawn,
        $.select,
        $.parallel,
        $.constraints,
        $.inject,
        $.query,
        $.solve,
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
        choice($.ignored, $._variable_name),
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
          $._match_block,
          $._match_lambda,
        ),
      ),
    _match_lambda: ($) =>
      seq("->", $._expression),
    _match_block: ($) =>
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
        field("expressions", $.expressions),
      ),
    _pattern_cons: ($) =>
      seq(
        $._pattern,
        optional(seq("::", $._pattern)),
      ),
    _pattern: ($) =>
      choice(
        $.ignored,
        $._literal,
        $._variable_name,
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
    select: ($) =>
      seq(
        "select",
        "{",
        repeat(
          alias($._select_case, $.case),
        ),
        "}",
      ),
    _select_case: ($) =>
      seq(
        "case",
        field(
          "pattern",
          choice(
            $.gets,
            alias($.ignored, $.default),
          ),
        ),
        "=>",
        field("expressions", $.expressions),
      ),
    parallel: ($) =>
      seq(
        "par",
        "(",
        zero_or_more_by($.gets, ";"),
        ")",
        "yield",
        $._expression,
      ),

    ///////////// 'SIMPLE' EXPRESSIONS ////////////
    tuple: ($) =>
      seq(
        "(",
        one_or_more($._expression),
        ")",
      ),
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
          choice(
            $._uppercase_name,
            $._lowercase_name,
            $._greek_name,
            $._math_name,
            $._operator_name,
          ),
        ),
      ),
    ref: ($) =>
      seq(
        "ref",
        $._expression,
        "@",
        $._lowercase_name,
      ),
    spawn: ($) =>
      seq(
        "spawn",
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
        field("body", $.block),
      ),
    let: ($) =>
      seq(
        "let",
        $._pattern,
        optional(seq(":", $._type)),
        "=",
        $._expression,
      ),
    call_expression: ($) =>
      prec(
        PREC.call,
        seq(
          field(
            "function",
            choice(
              $._function_name,
              $._uppercase_name,
              $.field,
              $.group,
              $.call_expression,
            ),
          ),
          field("arguments", $.arguments),
        ),
      ),
    object_constructor: ($) =>
      seq(
        "new",
        field(
          "type",
          choice(
            $._lowercase_name,
            $._uppercase_name,
            $.field,
          ),
        ),
        field("arguments", $.arguments),
      ),
    lambda: ($) =>
      prec(
        PREC.lambda,
        seq(
          field(
            "parameters",
            choice(
              $._typeless_parameters,
              alias(
                $.lowercase_name,
                $.polymorphic_identifier,
              ),
            ),
          ),
          "->",
          field("body", $.expressions),
        ),
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
            alias(
              "<+>",
              $.operator_identifier,
            ),
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
            alias(
              "or",
              $.operator_identifier,
            ),
            $._expression,
          ),
        ),
        prec.left(
          PREC.and,
          seq(
            $._expression,
            alias(
              "and",
              $.operator_identifier,
            ),
            $._expression,
          ),
        ),
        prec.left(
          PREC.bitwise_or,
          seq(
            $._expression,
            alias(
              "|||",
              $.operator_identifier,
            ),
            $._expression,
          ),
        ),
        prec.left(
          PREC.bitwise_xor,
          seq(
            $._expression,
            alias(
              "^^^",
              $.operator_identifier,
            ),
            $._expression,
          ),
        ),
        prec.left(
          PREC.bitwise_and,
          seq(
            $._expression,
            alias(
              "&&&",
              $.operator_identifier,
            ),
            $._expression,
          ),
        ),
        prec.left(
          PREC.equality,
          seq(
            $._expression,
            alias(
              choice("==", "!=", "<=>"),
              $.operator_identifier,
            ),
            $._expression,
          ),
        ),
        prec.left(
          PREC.comparison,
          seq(
            $._expression,
            alias(
              choice("<=", ">=", "<", ">"),
              $.operator_identifier,
            ),
            $._expression,
          ),
        ),
        prec.left(
          PREC.bitwise_shift,
          seq(
            $._expression,
            alias(
              choice(">>>", "<<<"),
              $.operator_identifier,
            ),
            $._expression,
          ),
        ),
        prec.left(
          PREC.multiply,
          seq(
            $._expression,
            alias(
              choice(
                "**",
                "*",
                "/",
                "mod",
                "rem",
              ),
              $.operator_identifier,
            ),
            $._expression,
          ),
        ),
        prec.left(
          PREC.add,
          seq(
            $._expression,
            alias(
              choice("+", "-"),
              $.operator_identifier,
            ),
            $._expression,
          ),
        ),
        prec.left(
          PREC.cons,
          seq(
            $._expression,
            alias(
              "::",
              $.operator_identifier,
            ),
            $._expression,
          ),
        ),
        prec.left(
          PREC.append,
          seq(
            $._expression,
            alias(
              ":::",
              $.operator_identifier,
            ),
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
        $.type_field,
        $.type_constraint,
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
    type_field: ($) =>
      prec(
        PREC.field,
        seq(
          choice($.type, $.type_field),
          ".",
          $.type,
        ),
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
              field("effects", $.effects),
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
    type_definition: ($) =>
      prec(
        1,
        seq(
          "type",
          $._uppercase_name,
          optional(
            seq(
              choice("=", ":"),
              choice(
                $._uppercase_name,
                $._type,
                $.effect_list,
              ),
            ),
          ),
        ),
      ),
    effect_list: ($) =>
      seq("{", $._effect, "}"),
    type_constraint: ($) =>
      seq(
        "#{",
        field(
          "tables",
          alias(
            $._type_tables,
            $.table_list,
          ),
        ),
        optional(
          seq(
            "|",
            field(
              "variable",
              $._type_identifier,
            ),
          ),
        ),
        "}",
      ),
    _type_tables: ($) =>
      one_or_more(
        alias($._type_table, $.table),
      ),
    _type_table: ($) =>
      seq(
        $._uppercase_name,
        alias($._type_terms, $.terms),
      ),
    _type_terms: ($) =>
      seq(
        "(",
        zero_or_more_by($._type, /[;,]/),
        ")",
      ),

    /////// TRAITS //////////
    trait_definition: ($) =>
      seq(
        optional($.modifiers),
        "trait",
        field("trait", $.type),
        field(
          "body",
          alias(
            $._trait_definition_body,
            $.template_body,
          ),
        ),
      ),
    _trait_definition_body: ($) =>
      seq(
        "{",
        repeat(
          choice(
            $.function_definition,
            $.type_definition,
          ),
        ),
        "}",
      ),
    trait_implementation: ($) =>
      seq(
        "instance",
        field("type", $.type),
        optional(
          seq(
            "with",
            field("trait", $.type),
          ),
        ),
        field(
          "body",
          alias(
            $._trait_implementation_body,
            $.template_body,
          ),
        ),
      ),
    _trait_implementation_body: ($) =>
      seq(
        "{",
        repeat(
          choice(
            $.function_declaration,
            $.type_definition,
          ),
        ),
        "}",
      ),

    /////// COMMENTS ////////////
    // TODO: Doc and block comments
    comment: ($) => token(seq("//", /.*/)),
    block_comment: ($) =>
      seq(
        token("/*"),
        repeat(
          choice(token(/./), token("//")),
        ),
        token("*/"),
      ),

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
        $._string,
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
    _string: ($) =>
      choice($.string, $.regex),
    string: ($) =>
      seq(
        '"',
        repeat(
          choice(
            $._string_fragment,
            $._escape_sequence,
            $._interpolation,
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

    /////// FIXPOINTS ///////
    constraints: ($) =>
      seq(
        "#{",
        repeat(choice($.fact, $.rule)),
        "}",
      ),
    facts: ($) =>
      prec.left(
        one_or_more(
          alias($._fact_inner, $.fact),
        ),
      ),
    fact: ($) => seq($._fact_inner, "."),
    _fact_inner: ($) =>
      seq(
        optional(alias("not", $.unary)),
        field("table", $._uppercase_name),
        field("terms", $.terms),
      ),
    terms: ($) =>
      seq(
        "(",
        zero_or_more_by(
          choice($._expression, $.ignored),
          /[;,]/,
        ),
        ")",
      ),
    rule: ($) =>
      seq(
        field(
          "head",
          alias($._fact_inner, $.fact),
        ),
        ":-",
        field(
          "body",
          alias($.facts, $.rule_body),
        ),
        ".",
      ),
    inject: ($) =>
      seq(
        "inject",
        field(
          "data",
          alias(
            $._expression_list,
            $.data_list,
          ),
        ),
        "into",
        field("tables", $.table_list),
      ),
    table_list: ($) =>
      prec.left(one_or_more($.table)),
    table: ($) =>
      seq(
        $._uppercase_name,
        "/",
        alias($.integer, $.arity),
      ),
    query: ($) =>
      seq(
        "query",
        field(
          "source",
          alias(
            $._expression_list,
            $.source_list,
          ),
        ),
        "select",
        field("select", $._expression),
        "from",
        field("facts", $.facts),
      ),
    solve: ($) =>
      seq(
        "solve",
        field(
          "constraints",
          $.constraint_list,
        ),
        "project",
        field("tables", $.project_list),
      ),
    constraint_list: ($) =>
      one_or_more($._expression),
    project_list: ($) =>
      prec.left(
        one_or_more($._uppercase_name),
      ),

    // Workaround to https://github.com/tree-sitter/tree-sitter/issues/1156
    // We give names to the token_ constructs containing a regexp
    // so as to obtain a node in the CST.
    _string_fragment: ($) =>
      token.immediate(prec(1, /[^"\\$]+/)),
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
    escape_sequence: ($) =>
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
    _interpolation: ($) =>
      choice(
        prec(2, $.interpolation),
        prec(1, token.immediate("$")),
      ),
    interpolation: ($) =>
      seq(
        token.immediate("${"),
        $._stmt,
        "}",
      ),
    regex: ($) =>
      seq(
        'regex"',
        repeat(
          choice(
            $.regex_escape_sequence,
            $._string_fragment,
            $._escape_sequence,
            "$",
          ),
        ),
        '"',
      ),
    regex_escape_sequence: ($) =>
      choice(
        // Single character escapes
        token.immediate(
          /\\{2}[aAbBdDeEfGhnpPQrsStwWvzZ.*+?\{\}\[\]\(\)\|\^\$\-0-9]/,
        ),
        // Two character escapes
        token.immediate(/\\{4}/),
        // Unicode options
        token.immediate(
          /\\{2}x[0-9a-fA-F]{2}/,
        ),
        token.immediate(
          /\\{2}u[0-9a-fA-F]{4}/,
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

    ignored: ($) => "_",

    /////// NAMES ////////
    uppercase_name: ($) =>
      /_?[A-Z][a-zA-Z0-9_]*/,
    lowercase_name: ($) =>
      /_?[a-z][a-zA-Z0-9_]*/,
    name: ($) => /[a-zA-Z][a-zA-Z0-9_]*/,
    greek_name: ($) => /[\u0370-\u03FF]+/,
    math_name: ($) => /[\u2190-\u22FF]+/,
    _uppercase_name: ($) =>
      alias($.uppercase_name, $.identifier),
    _lowercase_name: ($) =>
      alias($.lowercase_name, $.identifier),
    _name: ($) =>
      alias($.name, $.identifier),
    _greek_name: ($) =>
      alias($.greek_name, $.identifier),
    _math_name: ($) =>
      alias($.math_name, $.identifier),
    _operator_name: ($) =>
      alias($.operator_name, $.identifier),
    operator_name: ($) =>
      /[\+\-\*<>=!&|\^\$][\+\-\*<>=!&|\^\$]+/,
    _variable_name: ($) =>
      choice(
        $._lowercase_name,
        $._math_name,
        $._greek_name,
      ),
    _function_name: ($) =>
      choice(
        $._lowercase_name,
        $._operator_name,
        $._math_name,
        $._greek_name,
      ),
  },
});
