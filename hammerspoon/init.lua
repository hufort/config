-- Quit Safari after one hour without interaction with Safari itself.
-- Activity in other applications does not reset this timer.
local safariIdleTimeout = 60 * 60
local safariBundleID = "com.apple.Safari"
local lastSafariActivity = hs.timer.secondsSinceEpoch()

local function isSafariFrontmost()
  local app = hs.application.frontmostApplication()
  return app and app:bundleID() == safariBundleID
end

local function recordSafariActivity()
  if isSafariFrontmost() then
    lastSafariActivity = hs.timer.secondsSinceEpoch()
  end
end

safariActivityTap = hs.eventtap.new({
  hs.eventtap.event.types.keyDown,
  hs.eventtap.event.types.leftMouseDown,
  hs.eventtap.event.types.rightMouseDown,
  hs.eventtap.event.types.otherMouseDown,
  hs.eventtap.event.types.scrollWheel,
}, function()
  recordSafariActivity()
  return false
end):start()

safariApplicationWatcher = hs.application.watcher.new(function(_, eventType, app)
  if app:bundleID() == safariBundleID and (
    eventType == hs.application.watcher.launched or
    eventType == hs.application.watcher.activated
  ) then
    lastSafariActivity = hs.timer.secondsSinceEpoch()
  end
end):start()

safariIdleTimer = hs.timer.doEvery(30, function()
  local safari = hs.application.get(safariBundleID)

  if safari and hs.timer.secondsSinceEpoch() - lastSafariActivity >= safariIdleTimeout then
    hs.printf("[safari-idle] quitting Safari after %d seconds of inactivity", safariIdleTimeout)
    safari:kill()
  end
end)
