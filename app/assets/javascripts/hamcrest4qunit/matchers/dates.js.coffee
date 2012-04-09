h4q.dateAfterOrEqualTo = (d) -> h4q.dateAfter d, true
h4q.dateAfter = (d, inclusive) ->
  unless d? and d instanceof Date
    throw new Error message: "dateAfter must have a valid comparison date"

  new Matcher
    date: d
    included: inclusive
    inclusive: ->
      @included = true
      this

    _matches: (v,msg) ->
      unless v? and v instanceof Date
        msg.appendText("was").appendValue( v )
        false
      else
        if @included
          if v >= @date
            msg.appendText("was").appendRawValue v.toString()
            true
          else
            msg.appendRawValue(v.toString())
               .appendText("is not after or equal to")
               .appendRawValue(@date.toString())
            false
        else
          if v > @date
            msg.appendText("was").appendRawValue(v.toString())
            true
          else
            msg.appendRawValue(v.toString())
               .appendText("is not after")
               .appendRawValue(@date.toString())
            false

    _describeTo: (msg) ->
      if @included
        msg.appendText("a date after or equal to")
           .appendRawValue(@date.toString())
      else
        msg.appendText("a date after").appendRawValue(@date.toString())

h4q.dateBeforeOrEqualTo = (d) -> h4q.dateBefore d, true
h4q.dateBefore = (d,inclusive) ->
  unless d? and d instanceof Date
    throw new Error message: "dateBefore must have a valid comparison date"

  new Matcher
    date: d
    included: inclusive
    inclusive: ->
      @included = true
      this
    _matches: (v,msg) ->
      unless v? and v instanceof Date
        msg.appendText("was").appendValue(v)
        false
      else

        if @included
          if v <= @date
            msg.appendText("was").appendRawValue(v.toString())
            true
          else
            msg.appendRawValue(v.toString())
               .appendText("is not before or equal to")
               .appendRawValue(@date.toString())
            false
        else
          if v < @date
            msg.appendText("was").appendRawValue(v.toString())
            true
          else
            msg.appendRawValue(v.toString())
               .appendText("is not before")
               .appendRawValue(@date.toString())
            false

    _describeTo: (msg) ->
      if @included
        msg.appendText("a date before or equal to")
           .appendRawValue(@date.toString())
      else
        msg.appendText("a date before").appendRawValue(@date.toString())

h4q.dateBetween = (a,b,inclusive) ->

  unless a? and a instanceof Date
    throw new Error message: "dateBetween must have a valid first date"

  unless b? and b instanceof Date
    throw new Error message: "dateBetween must have a valid first date"

  if b <= a
    throw new Error
      message: "dateBetween second date must be after the first date"

  new Matcher
    a: a
    b: b
    included: inclusive
    inclusive: ->
      @included = true
      this

    _matches: (v, msg) ->
      unless v? and v instanceof Date
        msg.appendText("was").appendValue(v)
        false
      else
        if @included
          if v < @a
            msg.appendRawValue(v.toString())
               .appendText("is before the min date")
               .appendRawValue(@a.toString())
            false
          else if( v > @b )
            msg.appendRawValue(v.toString())
               .appendText("is after the max date")
               .appendRawValue(@b.toString())
            false
          else
            msg.appendText("was").appendRawValue(v.toString())
            true
        else
          if v <= @a
            msg.appendRawValue(v.toString())
               .appendText("is before or equal to the min date")
               .appendRawValue(@a.toString())
            false
          else if v >= @b
            msg.appendRawValue(v.toString())
               .appendText("is after or equal to the max date")
               .appendRawValue(@b.toString())
            false
          else
            msg.appendText("was").appendRawValue(v.toString())
            true

    _describeTo: (msg) ->
      msg.appendText("a date between")
         .appendRawValue(@a.toString())
         .appendText("and")
         .appendRawValue(@b.toString())
      if @included
        msg.appendText("inclusive")

h4q.dateEquals = (d) ->
  unless d? and d instanceof Date
    throw new Error
      message: "dateEquals expect a valid Date object as argument"

  new Matcher
    date: d
    _matches: (v,msg) ->
      unless v? and v instanceof Date
        msg.appendText("was").appendValue(v)
        false
      else
        msg.appendText("was").appendRawValue(v.toString())
        v.getTime() is @date.getTime()

    _describeTo: (msg) ->
      msg.appendText("a Date equal to").appendRawValue(@date.toString())

