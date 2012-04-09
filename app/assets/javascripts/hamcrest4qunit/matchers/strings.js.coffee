h4q.startsWith =  (s) ->
  unless s? then throw new Error message: "startsWith must receive an argument"

  new Matcher
    start: s
    _matches: (v,msg) ->
      msg.appendText("was").appendValue(v)

      unless v? and typeof v is "string"
        false
      else
        v.indexOf(@start) is 0

    _describeTo: (msg) ->
      msg.appendText("a String starting with").appendValue(@start)

h4q.endsWith = (s) ->
  unless s?
    throw new Error message: "endsWith must receive an argument"

  new Matcher
    end: s
    _matches: (v,msg) ->
      msg.appendText("was").appendValue(v)
      unless v? and typeof v is "string"
        false
      else
        v.indexOf(@end) is v.length - @end.length

    _describeTo: (msg) ->
      msg.appendText("a String ending with").appendValue(@end)

h4q.contains = (s) ->
  unless s?
    throw new Error message: "endsWith must receive an argument"

  new Matcher
    search: s
    _matches: (v,msg) ->
      msg.appendText("was").appendValue(v)
      unless v? and typeof v is "string"
        false
      else
        v.indexOf(@search) isnt -1

    _describeTo: (msg) ->
      msg.appendText("a String containing").appendValue(@search)

h4q.stringWithLength = (l) ->

  if isNaN l
    throw new Error message: "length argument must be a valid number"
  if l < 0
    throw new Error message: "length argument must be greater than
                              or equal to 0"

  return h4q.emptyString() if l is 0

  new Matcher
    length: l
    _matches: (v,msg) ->
      unless v?
        msg.appendText("was").appendValue(v)
        false
      else if typeof v isnt "string"
        msg.appendText("was").appendValue(v)
        false
      else
        if v.length is @length
          msg.appendText("was").appendValue(v)
          true
        else
          msg.appendValue(v)
             .appendText("is a String of length")
             .appendValue(v.length)
          false

    _describeTo: (msg) ->
      msg.appendText("a String with a length of").appendValue(@length)

h4q.emptyString = ->
  new Matcher
    _matches: (v,msg) ->

      unless v?
        msg.appendText("was").appendValue(v)
        false
      else if typeof v isnt "string"
        msg.appendText("was").appendValue(v)
        false
      else
        if v.length is 0
          msg.appendText("was").appendValue(v)
          true
        else
          msg.appendValue(v)
             .appendText("is a String of length")
             .appendValue(v.length)
          false

    _describeTo: (msg) ->
      msg.appendText("an empty String")

h4q.matchRe = (re) ->
  unless re?
    throw new Error message: "The 're' argument can't be null"
  unless re instanceof RegExp or typeof re is "string"
    throw new Error message: "the re argument must be a regexp or a string"
  if typeof re is "string"
    re = new RegExp re, "gi"

  new Matcher
    re: re
    _matches: (v,msg) ->
      msg.appendText("was").appendValue(v)
      unless v? and typeof v is "string"
        false
      else
        @re.exec v

    _describeTo: (msg) ->
      msg.appendText("a String which match").appendRawValue(String @re)

