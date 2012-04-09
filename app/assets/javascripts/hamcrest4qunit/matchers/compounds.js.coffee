h4q.allOf = ->
  args = h4q.argumentsToArray arguments
  matchers = []
  for m in args
    if m instanceof Matcher
      matchers.push m
    else
      matchers.push equalTo m

  new Matcher
    matchers: matchers
    _matches: (v, msg) ->
      msg.appendText("was").appendValue v

      hasError = false
      for m in @matchers
        msgtmp = new Description()
        res = m.matches v, msgtmp
        unless res
          hasError = true

      not hasError

    _describeTo: (msg) ->
      l = @matchers.length
      msg.appendText '('
      @matchers.map (o, i) ->
        msgtmp = new Description()
        if i is l-1
          msg.appendText "and"
        else if i > 0
          msg.appendText ","

        o.describeTo msg

      msg.appendText ')'

h4q.anyOf = ->
  args = h4q.argumentsToArray arguments
  matchers = []
  for m in args
    if m instanceof Matcher
      matchers.push m
    else
      matchers.push equalTo m

  new Matcher
    matchers: matchers
    _matches: (v, msg) ->
      msg.appendText("was ").appendValue v
      hasMatches = false
      hasError = false
      for m in @matchers
        msgtmp = new Description()
        res = m.matches v, msgtmp
        if res
          hasMatches = true

      hasMatches

    _describeTo: (msg) ->
      msg.appendText '('
      l = @matchers.length
      @matchers.map (o,i) ->
        if i is l - 1
          msg.appendText "or"
        else if i > 0
          msg.appendText ","

        o.describeTo msg

      msg.appendText ')'

h4q.both = (m) ->
  new Matcher
    matchA: if m instanceof Matcher then m else equalTo m
    and: (m) ->
      this.matchB = if m instanceof Matcher then m else equalTo m
      this

    _matches: (v,msg) ->
      unless @matchB?
        throw new Error
          message: "the both..and matcher require an 'and' assertion"

      msgtmp1 = new Description()
      msgtmp2 = new Description();

      res1 = @matchA.matches v, msgtmp1
      res2 = @matchB.matches v, msgtmp2

      if res1 and res2
        msg.appendText("was").appendValue v
      else
        msg.appendText msgtmp1 unless res1


        msg.appendText "and" unless res1 or res2

        msg.appendText msgtmp2 unless res2

      res1 and res2

    _describeTo: (msg) ->
      unless @matchB?
        throw new hasError
          message: "the both..and matcher require an 'and' assertion"

      msg.appendText("both").appendDescriptionOf(@matchA)
         .appendText("and").appendDescriptionOf(@matchB)

h4q.either = (m) ->
  new Matcher
    matchA: if m instanceof Matcher then m else equalTo m
    or: (m) ->
      @matchB = if m instanceof Matcher then m else equalTo m
      this

    _matches: (v, msg) ->
      msg.appendText("was").appendValue v
      unless @matchB?
        throw new Error
          message: "the either..or matcher require an 'or' assertion"

      msgtmp = new Description()
      @matchA.matches(v, msgtmp) or @matchB.matches(v, msgtmp)

    _describeTo: (msg) ->
      unless @matchB?
        throw new Error
          message: "the either..or matcher require an 'or' assertion"

      msg.appendText("either").appendDescriptionOf(@matchA)
         .appendText("or").appendDescriptionOf(@matchB)
