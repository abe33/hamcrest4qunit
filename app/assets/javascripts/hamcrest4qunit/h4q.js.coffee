TAB_STRING = "   "

h4q = {}
window.h4q = h4q

h4q.tokenReplace = (s) ->
  args = h4q.argumentsToArray arguments
  args.shift()

  if args.length > 0 and args[0] instanceof Object
    kwargs = args[0]
    s = s.replace /\${([^}]+)}/g, ->
      key = arguments[1]
      if kwargs.hasOwnProperty(key) then kwargs[key] else arguments[0]

    args.shift()

  s.replace /\$([0-9]+)/g, ->
    index = parseInt arguments[1]
    if index < args.length then args[index] else arguments[0]

h4q.argumentsToArray = (args) -> arg for arg in args

h4q.sortProperties = (o) ->
  b = (k for k of o)
  b.sort()
  b

h4q.getType = (thing) ->
  return "Null" unless thing?

  results = /\[object (.{1,})\]/.exec Object.prototype.toString.call thing

  if results and results.length > 1 then results[1] else ""

h4q.getTypeName = (type) ->
  results = /function (.{1,})\(/.exec type.toString()
  if results and results.length > 1 then results[1] else ""

h4q.aPrefix = (s) -> if s.substr(0,1) in "aeiouAEIOU" then "an" else "a"

h4q.escapeHtml = (s) ->
  return "" unless s?

  s = String(s)
  s.replace /[\&"<>\\]/g, (s) ->
    switch s
      when "&"  then "&amp"
      when "\\" then "\\\\"
      when '"'  then '\"'
      when "<"  then "&lt"
      when ">"  then "&gt"
      else s

h4q.nodeToString = (node, indent="") ->
  unless node? and node instanceof Node
    throw new Error
      message: "nodeToString expect a valid node as argument"

  isRootCall = indent is ""
  tag = String(node.nodeName).toLowerCase()
  attr = h4q.attrToString node
  content = h4q.contentToString node, indent

  s = "#{indent}<#{tag}#{attr}>#{content}</#{tag}>"

  if isRootCall then h4q.escapeHtml s else s

h4q.attrToString = (node) ->
  exludedAttrs = [
    "length",          "item",             "getNamedItem",
    "setNamedItem",    "removeNamedItem",  "getNamedItemNS",
    "setNamedItemNS",  "removeNamedItemNS"
  ]

  s = ""
  alreadyPrinted = []
  for attr of node.attributes
    name = node.attributes[attr].name

    unless attr in exludedAttrs or name in alreadyPrinted
      s += " #{name}=\"#{node.attributes[attr].value}\""
      alreadyPrinted.push name

  return s

h4q.contentToString = (node, indent) ->
  s = ""
  nodes = node.childNodes
  return "" unless nodes?

  l = nodes.length
  contentIsOnlyText = true
  res = []
  for node in nodes

    if node.nodeType is 3 then res.push node.textContent
    else
      res.push h4q.nodeToString node, indent + TAB_STRING
      contentIsOnlyText = false

  if contentIsOnlyText then s += res.join ""
  else
    res = res.map (o, i) ->
      if /</.exec o then o else indent + TAB_STRING + o

    s += "\n#{res.join "\n"}"

  s + (if l > 0 and not contentIsOnlyText then "\n#{indent}" else "")

h4q.push = (result, mismatchMsg, expectedMsg, message) ->
  details =
      result: result
      message: message

  resultMsg = "<tr class='test-actual'>
                <th>#{if result? then "And:" else "But:"}</th>
                <td><pre>#{mismatchMsg.message}</pre></td>
              </tr>"

  diffMsg = if mismatchMsg.hasDiff()
    "<tr class='test-diff'>
      <th>Diff: </th>
      <td><pre>#{mismatchMsg.diff}</pre></td>
    </tr>"
  else
    ""

  output = "<span class='test-message'>#{message}</span>
            <table>
              <tr class='test-expected'>
                <th>Expected: </th>
                <td><pre>#{expectedMsg.message}</pre></td>
              </tr>
              #{resultMsg}
              #{diffMsg}
            </table>"

  QUnit.log details
  QUnit.config.current.assertions.push
    result: result,
    message: output

h4q.assertThat = (target, matcher=h4q.equalTo(true), description=null) ->
  throw new Error message: "Unsupported assertion" if arguments.length is 0

  expectedMsg = new Description()
  mismatchMsg = new Description()

  matcher = h4q.equalTo matcher unless matcher instanceof Matcher

  expectedMsg.appendDescriptionOf( matcher )
  result = matcher.matches( target, mismatchMsg )

  h4q.push result,
           mismatchMsg,
           expectedMsg,
           if message? then message else if result? then "okay" else "failed"
