# twine-gcal

An app to relay pings from a [twine device](http://store.supermechanical.com/products/twine-only) to gcal, based on a very idiosyncratic set of usage requirements to help *me* remember to put my braces in on time.

This app takes a ping on two http endpoints (host:port/bracesout and host:port/bracesin) to insert Google Calendar events to remind me to put my Invisalign braces back in.  The idea is that you flip over the twine when you take out your braces, and flip it back when you put them in.  Thus, you'll have a calendar that not only reminds you to put your braces back in, but also tracks your usage.

The setup for the Google app, especially the oauth part, is best described in the google-calendar module and google-oauth-serviceaccount module readmes.

The code is kinda crap... did it in a couple hours in the middle of the night after inspiration hit.  

I'll be revisiting this when I get a BLE device so that I can have this work through an app on my iOS device... using the reminders API might lead to a better overall experience... or not.  The big win of BLE will be battery life, the ability to not need an intermediary web service, and the ability to manage preferences on the iOS device.

## Apps

### app00.js

This is a web-server based auth into gcal.  It doesn't actually do anything.  I put this together and then figured out it was the wrong style of auth for the kind of functionality I was putting together.  It does do something though... so it's an example of using passport to auth into gcal.  It's here simply as a reference.  The 'views' subdirectory goes with this app and is not used by app01.js.

### app01.js

This is the actual thing that I set out to make.  This does service interaction with gcal, so it doesn't require an interactive session to grant permissions for gcal, etc.  When ping'd on a couple of express endpoints, it will insert new events in gcal.  It's sub-optimal in a few ways, but it's serving my purposes nicely.

**Todos** include some basic optimizations, like not authing twice to insert the two events for the out endpoint.  Also, persistently tracking state would be nice, so that I don't accidentally get two out endpoint calls in a row, etc.  Also, keeping stats on how long my braces are out on average (for each day of the week, etc.) would be fun.

## Config

### Makefile

Type `make help` to see what the makefile can do.

To get node module deps set up for each of the apps, run the target for the respective app, e.g., `make npm-app01`.

### Credentials

You will need to generate a new service credential in the [Google Developers Console](https://cloud.google.com/console#/project).  A lot of this is described in Google docs and the google-oauth-serviceaccount readme (link below).

You will need to edit oauth-config.json to include the app credentials you get from Google.

## References

* [https://npmjs.org/package/google-calendar](https://npmjs.org/package/google-calendar)
* [https://npmjs.org/package/passport-google-oauth](https://npmjs.org/package/passport-google-oauth) (For web auth)
* [https://npmjs.org/package/google-oauth-serviceaccount](https://npmjs.org/package/google-oauth-serviceaccount) (For service auth)
* [https://developers.google.com/google-apps/calendar/v3/reference/](https://developers.google.com/google-apps/calendar/v3/reference/)



