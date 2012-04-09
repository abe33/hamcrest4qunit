h4q.equalTo = (m) ->
  new Matcher
    value: m
    _describeTo: (msg) -> msg.appendValue @value
    _matches: (v, msg) ->
      msg.appendText("was").appendValue v
      if v instanceof Array and @value instanceof Array
        l = v.length
        if @value.length isnt l
          msg.appendText("with a length of").appendValue l
          return false
        else
          hasError = false

          for i in [0..l-1]
            if `v[i] != this.value[i]`
              msg.appendText "and" if hasError

              msg.appendText ("with")
                 .appendValue(v[i])
                 .appendText ("at index")
                 .appendValue(i)
                 .appendText ("instead of")
                 .appendValue(@value[i])
              hasError = true

          if hasError
            msg.diff = QUnit.diff QUnit.jsDump.parse(@value),
                                  QUnit.jsDump.parse(v)

          return not hasError

      return true if `v == this.value`

      msg.diff = QUnit.diff QUnit.jsDump.parse(@value), QUnit.jsDump.parse(v)
      return false

h4q.strictlyEqualTo = (m) ->
  new Matcher
    value: m,
    _matches: (v, msg) ->
        msg.appendText("was ").appendValue v

        return true if v is @value

        msg.diff = QUnit.diff  QUnit.jsDump.parse(m),
                               QUnit.jsDump.parse(v)
        return false

    _describeTo: (msg) ->
      msg.appendText("a value strictly equal to").appendValue @value

h4q.not = (m) ->
  new Matcher
    submatch: m
    _matches: (v, msg) ->
      if @submatch instanceof Matcher
        not @submatch.matches v, msg
      else
        msg.appendText("was").appendValue v
        v isnt @submatch

    _describeTo: (msg) ->
      if @submatch instanceof Matcher
        msg.appendText "not"
        @submatch.describeTo msg
      else
        msg.appendText("not").appendValue @submatch

h4q.nullValue = ->
  new Matcher
    _matches: (v, msg) ->
      msg.appendText("was").appendValue v
      not v?

    _describeTo: (msg) ->
      msg.appendValue null

h4q.notNullValue = ->
  new Matcher
    _matches: (v, msg) ->
      msg.appendText("was").appendValue v
      v?
    _describeTo: (msg) ->
      msg.appendText("not").appendValue null

h4q.anything = ->
  new Matcher
    _matches: (v, msg) ->
      msg.appendText("was").appendValue v
      true

    _describeTo: (msg) ->
      msg.clearMessage().appendText "anything"

h4q.isA = (type) ->
  new Matcher
    type:type
    _matches: (v, msg) ->
      msg.appendText("was").appendValue v
      typeof v is @type
    _describeTo: (msg) ->
      msg.appendText(aPrefix @type).appendRawValue @type

h4q.describedAs = (m, t) ->
  unless m?  and m instanceof Matcher
    throw new Error message: "describedAs first argument must
                              be a valid Matcher instance"

  unless t? and typeof t is "string"
    throw new Error message: "describedAs second argument must
                              be a valid string"

  extraArgs = h4q.argumentsToArray arguments
  extraArgs.shift()
  extraArgs.shift()

  new Matcher
    description: t
    matcher: m
    extraArgs: extraArgs
    _matches: (v,msg) ->
      @matcher.matches v, msg
    _describeTo: (msg) ->
      msg.appendText h4q.tokenReplace.apply null,
                                            [@description].concat extraArgs
