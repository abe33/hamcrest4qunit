h4q.throwsError = (m, scope, args) ->

  m = equalTo m if m? and not (m instanceof Matcher)

  new Matcher
    errorMatcher: m
    scope: scope
    arguments: args
    noArgs: false
    withoutArgs: ->
      @noArgs = true
      this
    withArgs: ->
      @arguments = h4q.argumentsToArray arguments
      this
    withScope: (scope) ->
      @scope = scope
      this
    _matches: (v, msg) ->
      unless v? and typeof v is "function"
        msg.appendValue(v).appendText("is not a function")
        false

      else
        res = null
        try
          v.apply @scope, if @noArgs then [] else @arguments
        catch e
          if @errorMatcher
            errorMsg = new Description()
            res = @errorMatcher.matches e, errorMsg

            if res?
              msg.appendText("an exception was thrown and").appendText errorMsg
            else
              msg.appendText("an exception was thrown but").appendText errorMsg
              msg.diff = errorMsg.diff
          else
            msg.appendValue(e).appendText "was thrown"
            res = true

        unless res?
          res = false
          msg.appendValue(v).appendText "doesnt thrown"
          if @errorMatcher
            msg.appendDescriptionOf @errorMatcher
          else
            msg.appendText "any exception"
        res

    _describeTo: (msg) ->
      msg.appendText "a Function which throws"

      if @errorMatcher?
        msg.appendDescriptionOf @errorMatcher
      else
        msg.appendText "an exception"

      if @scope? or @arguments? or @noArgs
        msg.appendText "when called"

      if @scope?
        msg.appendText("with scope").appendValue @scope

      if @scope? and (@arguments? or @noArgs)
        msg.appendText "and"

      if not @noArgs and @arguments? and @arguments.length > 0
        msg.appendText("with arguments").appendValue @arguments
      else if @noArgs
        msg.appendText "without arguments"

h4q.returns = (m, s, a) ->

  m = equalTo m if m? and not (m instanceof Matcher)

  return new Matcher
    returnsMatcher: m
    arguments: a
    noArgs: false
    scope: s
    withoutArgs: ->
      @noArgs = true
      this
    withArgs: ->
      @arguments = h4q.argumentsToArray arguments
      this
    withScope: (scope) ->
      @scope = scope
      this
    _matches: (v, msg) ->
      unless v? and typeof v is "function"
        msg.appendValue(v).appendText "is not a Function"
        return false
      else
        res = v.apply @scope, if @noArgs then [] else @arguments

        if @returnsMatcher
          mmsg = new Description()
          mres = @returnsMatcher.matches res, mmsg

          msg.appendText("was")
             .appendValue(v)
             .appendText("of which returns")
             .appendText(mmsg)
          msg.diff = mmsg.diff
          return mres
        else
          if res?
            msg.appendText("was")
               .appendValue(v)
               .appendText("of which returns was")
               .appendValue(res)
            return true
          else
            msg.appendText("was")
               .appendValue(v)
               .appendText("which returned nothing")
            return false

    _describeTo: (msg) ->
      msg.appendText "a Function that returns"

      if @returnsMatcher?
        msg.appendDescriptionOf @returnsMatcher
      else
        msg.appendText "anything"

      if @scope? or @arguments? or @noArgs
        msg.appendText "when called"

      if @scope?
        msg.appendText("with scope").appendValue @scope

      if @scope and (@arguments? or @noArgs)
        msg.appendText "and"

      if not @noArgs and @arguments? and @arguments.length > 0
        msg.appendText("with arguments").appendValue @arguments
      else if @noArgs
        msg.appendText "without arguments"

