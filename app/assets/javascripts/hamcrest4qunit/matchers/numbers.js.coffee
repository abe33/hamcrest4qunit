h4q.nanValue = ->
   new Matcher
    _matches: (v, msg) ->
      msg.appendText("was").appendValue v
      isNaN v
    _describeTo: (msg) ->
      msg.appendValue NaN

h4q.notNanValue = ->
  new Matcher
    _matches: (v,msg) ->
      msg.appendText("was").appendValue v
      not isNaN v
    _describeTo: (msg) ->
      msg.appendText("not").appendValue NaN

h4q.between = (a, b) ->
  if isNaN a then throw new Error message: "a must be a valid number"
  if isNaN b then throw new Error message: "b must be a valid number"
  if a >= b  then throw new Error message: "b must be a greater number than a"

  new Matcher
    a: a
    b: b
    included: false
    inclusive: ->
      @included = true
      this

    _matches: (v, msg) ->
      if @included
        if v >= @a and v <= @b
          msg.appendText("was").appendValue(v)
          true
        else
          if v < @a
            msg.appendValue(v)
               .appendText("was lower than the min value")
               .appendValue(@a)
          else
            msg.appendValue(v)
               .appendText("was greater than the max value")
               .appendValue(@b)
          false
      else
        if v > @a and v < @b
          msg.appendText("was").appendValue(v)
          true
        else
          if v <= @a
            msg.appendValue(v)
               .appendText("was lower or equal to the min value")
               .appendValue(@a)
          else
            msg.appendValue(v)
               .appendText("was greater or equal to the max value")
               .appendValue(@b)
          false

    _describeTo: (msg) ->
      msg.appendText("a Number between")
         .appendValue(@a)
         .appendText("and")
         .appendValue(@b)

      if @included
        msg.appendText "inclusive"
      else
        msg.appendText "exclusive"

h4q.closeTo = (a, b) ->
  if isNaN a then throw new Error message: "a must be a valid number"
  if isNaN b then throw new Error message: "b must be a valid number"
  new Matcher
    a: a
    b: b
    _matches: (v, msg) ->
      # required to solve the 2 - 1.9 = 0.1000000000000009 issue
      decimal11 = (n) -> Math.floor(n * 10000000000) / 10000000000
      delta = decimal11 Math.abs @a - v

      if delta <= @b
        msg.appendText("was").appendValue(v)
        true
      else
        msg.appendValue(v)
           .appendText("differed by")
           .appendValue(delta - @b)
        false

    _describeTo: (msg) ->
      msg.appendText("a Number within")
         .appendValue(@b)
         .appendText("of")
         .appendValue(@a)

h4q.atLeast = (n) -> h4q.greaterThanOrEqualTo n
h4q.greaterThanOrEqualTo = (n) -> h4q.greaterThan n, true
h4q.greaterThan = (n, b) ->
  if isNaN n
    throw new Error message: "The comparison value must be a valid number"

  new Matcher
    n: n
    included: b
    inclusive: ->
      @included = true
      this

    _matches: (v, msg) ->
      if @included

        if v >= @n
          msg.appendText("was").appendValue(v)
          true
        else
          msg.appendValue(v)
              .appendText("was not greater than")
              .appendText("or equal to")
              .appendValue(@n)
          false
      else

        if v > @n
          msg.appendText("was").appendValue(v)
          true
        else
          msg.appendValue(v)
            .appendText("was not greater than")
            .appendValue(@n)
          false

    _describeTo: (msg) ->
      msg.appendText "a Number greater than"
      msg.appendText "or equal to" if @included
      msg.appendValue @n

h4q.atMost = (n) -> h4q.lowerThanOrEqualTo n
h4q.lowerThanOrEqualTo = (n) -> h4q.lowerThan n, true
h4q.lowerThan = (n,b) ->
  if isNaN n
    throw new Error message: "The comparison value must be a valid number"

  new Matcher
    n: n
    included: b
    inclusive: ->
      @included = true
      this

    _matches: (v, msg)->
      if @included
        if v <= @n
          msg.appendText("was").appendValue(v)
          true
        else
          msg.appendValue(v)
             .appendText("was not lower than")
             .appendText("or equal to")
             .appendValue(@n)
          false
      else
        if v < @n
          msg.appendText("was").appendValue(v)
          true

        else
          msg.appendValue(v)
           .appendText("was not lower than")
           .appendValue(@n)
          false

    _describeTo: (msg) ->
      msg.appendText "a Number lower than"
      msg.appendText "or equal to" if @included
      msg.appendValue @n

