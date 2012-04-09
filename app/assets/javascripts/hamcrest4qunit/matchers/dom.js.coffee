h4q.equalToNode = (node) ->
  unless node?
    throw new Error message: "equalToNode expect an argument"
  else unless node instanceof Node
    throw new Error message: "equalToNode except a Node object as argument"

  new Matcher
    node: node
    _matches: (v,msg) ->
      unless v? and v instanceof Node
        msg.appendText("was").appendValue(v)
        false
      else
        msg.appendText("was\n").appendRawValue(h4q.nodeToString v)
        if v.isEqualNode(@node)
          true
        else
          msg.diff = QUnit.diff nodeToString(@node), h4q.nodeToString(v)
          false

    _describeTo: (msg) ->
      msg.appendText("a Node equal to\n")
         .appendRawValue(nodeToString @node)

h4q.hasAttribute = (a, m) ->

  unless a?
    throw new Error message: "hasAttribute expect an attribute name"
  else if typeof a isnt "string"
    throw new Error message: "attribute name must be a string"

  m = equalTo(m) if m? and not (m instanceof Matcher)

  new Matcher
    attribute: a
    matcher: m
    _matches: (v,msg) ->
      unless v? and v instanceof Node
        msg.appendText("was").appendValue(v)
        false
      else
        if v.attributes[@attribute]?
          if @matcher
            av = v.attributes[@attribute].value
            mismatchMsg = new Description()
            if !@matcher.matches av, mismatchMsg
              msg.appendText("attribute")
                 .appendRawValue(@attribute)
                 .appendText("value")
                 .appendText(mismatchMsg)
                 .appendText("in\n")
                 .appendRawValue(h4q.nodeToString v)
              msg.diff = mismatchMsg.diff
              false
            else
              msg.appendText("was\n").appendRawValue(h4q.nodeToString v)
              true
          else
            msg.appendText("was\n").appendRawValue(h4q.nodeToString v)
            true
        else
          msg.appendRawValue(h4q.nodeToString v)
             .appendText("do not have an attribute")
             .appendRawValue(@attribute)
          false

    _describeTo: (msg) ->
      msg.appendText("a Node with an attribute")
         .appendRawValue(@attribute)

      if @matcher
        msg.appendText("of which value is").appendDescriptionOf(@matcher)

