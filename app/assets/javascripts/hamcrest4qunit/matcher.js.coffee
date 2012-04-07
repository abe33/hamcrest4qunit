class hamcrest.Matcher
  constructor: (options) ->

    unless options._matches
      throw new Error
        message: "Improperly configured matcher, the matcher
                  expect a _matches method"

    if typeof options._matches isnt "function"
      throw new Error
        message: "Improperly configured matcher, the _matches
                  argument must be a function"

    unless options._describeTo
      throw new Error
        message: "Improperly configured matcher, the matcher expect
                  a _describeTo method"

    if typeof options._describeTo isnt "function"
      throw new Error
        message: "Improperly configured matcher, the _describeTo
                  argument must be a function"

    @[k] = v for k, v of options

  matches: (v, mismatchMsg) ->
    @_matches.call this, v, mismatchMsg

  describeTo: ( msg ) ->
    @_describeTo.call this, msg

