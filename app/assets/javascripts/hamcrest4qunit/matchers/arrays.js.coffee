h4q.arrayWithLength = (l) ->
  if isNaN l
    throw new Error message: "length argument must be a valid number"
  if l < 0
    throw new Error
      message: "length argument must be greater than or equal to 0"

  new Matcher
    length: l
    _matches: (v,msg) ->
      msg.appendText("was").appendValue(v)
      v? and
      v instanceof Array and
      v.length == @length

    _describeTo: (msg) ->
      msg.appendText("an Array with")
         .appendValue(@length)
         .appendText(if @length > 1 then "items" else "item")

h4q.emptyArray = ->
  new Matcher
    _matches: (v,msg) ->
      msg.appendText("was").appendValue(v)
      v? and
      v instanceof Array and
      v.length is 0

    _describeTo: (msg) ->
      msg.appendText "an empty Array"

h4q.array = ->
  args = h4q.argumentsToArray arguments
  matchers = []
  l = args.length

  return h4q.emptyArray() if l is 0

  for m in args
    if m instanceof Matcher
      matchers.push m
    else
      matchers.push equalTo m

  new Matcher
    matchers: matchers
    _matches: (v,msg) ->
      l = @matchers.length

      unless v?
        msg.appendText("was").appendValue(null)
        false
      else unless v instanceof Array
        msg.appendText("was").appendValue(v)
        false
      else if v.length isnt l
        msg.appendText("was an Array with")
           .appendValue(v.length)
           .appendText(if v.length > 1 then "items" else "item")
        false
      else
        a = @matchers
        hasError = false
        msg.appendText("was").appendRawValue("[").appendText("\n")

        v.forEach (o,i) ->
          msgtmp = new Description()
          res = a[i].matches o, msgtmp
          msg.appendText "  "
          if res
            msg.appendValue o
          else
            msg.appendText msgtmp.message
            hasError = true

          msg.appendText ",\n" if i < l-1

        msg.appendRawValue "\n]"

        not hasError

    _describeTo: (msg) ->
      l = @matchers.length

      msg.appendText("an Array with")
         .appendValue(l)
         .appendText(if l > 1 then "items" else "item")
         .appendText("like").appendRawValue("[").appendText("\n   ")

      for matcher, i in @matchers
        msg.appendDescriptionOf matcher
        msg.appendText(",\n   ") if i < l-1

      msg.appendRawValue("\n]")

h4q.everyItem = (m) ->
  unless m?
    throw new Error message: "everyItem must receive an argument"

  m = equalTo m unless m instanceof Matcher

  new Matcher
    matcher: m
    _matches: (v, msg) ->
      unless v?
        msg.appendText("was").appendValue(null)
        false
      else unless v instanceof Array
        msg.appendText("was").appendValue(v)
        false
      else
        for val, i in v
          msgtmp = new Description()
          unless @matcher.matches val, msgtmp
            msg.appendText(msgtmp.message)
               .appendText("at index")
               .appendValue(i)
            return false

        msg.appendText("was").appendValue(v)
        true

    _describeTo: (msg) ->
      msg.appendText("an Array of which every item is")
         .appendDescriptionOf( @matcher )

h4q.hasItem = (m) ->
  unless m?
    throw new Error message: "hasItem must receive an argument"

  m = equalTo m unless m instanceof Matcher

  new Matcher
    matcher: m
    _matches: (v,msg) ->
      unless v?
        msg.appendText("was").appendValue(null)
        false
      unless v instanceof Array
        msg.appendText("was").appendValue(v)
        false
      else
        l = v.length
        for val in v
          msgtmp = new Description()
          if @matcher.matches val, msgtmp
            msg.appendText("was").appendValue(v)
            return true

        msg.appendText "can't find any"
        false

    _describeTo: (msg) ->
      msg.appendText("an Array containing").appendDescriptionOf(@matcher)

h4q.hasItems = ->
  args = h4q.argumentsToArray arguments
  if args.length is 0
    throw new Error message: "hasItems must receive at least one argument"

  matchers = []
  for m in args
    if m instanceof Matcher
      matchers.push m
    else
      matchers.push equalTo m

  new Matcher
    matchers: matchers
    _matches: (v,msg) ->
      unless v?
        msg.appendText("was").appendValue(null)
        false
      unless v instanceof Array
        msg.appendText("was").appendValue(v)
        false
      else
        l = @matchers.length
        k = v.length
        gres = true
        mismsg = []
        msgtmp = new Description()
        for m in @matchers
          res = false
          for val, j in v
            res = m.matches(val, msgtmp) or res

          unless res
            d = new Description()
            d.appendDescriptionOf m
            mismsg.push d

          gres = res and gres

        if gres
          msg.appendText("was").appendValue(v)
        else
          l = mismsg.length
          if l is 1
            msg.appendText("can't find").appendText( mismsg )
          else
            msg.appendText("can't find neither")
            for v, i in mismsg
              if i is l-1
                msg.appendText "nor"
              else if i > 0
                msg.appendText ","

              msg.appendText v
        gres

    _describeTo: (msg) ->
      msg.appendText "an Array containing"
      for m, i in @matchers
        if i is @matchers.length - 1
          msg.appendText "and"
        else if i > 0
          msg.appendText ","

        msg.appendDescriptionOf m

