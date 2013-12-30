#!/usr/bin/env node --harmony

// modules

const gaccount = require('google-oauth-serviceaccount');
const google_calendar = require ('google-calendar');
const util = require ('util');
const express = require ( 'express' );

// globals

var gcal = null;
var gcalid = undefined;

// Some slightly paraameterized configs... the structure here is un-exploited...
// e.g., the functions that create events could be more data driven from this
// config object which would eliminate some code.

var config = {
    outs: {
        offsetStart: -1,
        offsetEnd: 4,
        offsetReminder: undefined
    },
    ins: {
        offsetStart: 60,
        offsetEnd: 75,
        offsetReminder: 15
    },
    done: {
        offsetStart: -1,
        offsetEnd: 4,
        offsetReminder: undefined
    },
    minuteMult: 1000 * 60
};

// Run a function given an already auth'd gcal instance.
// cmd = function ( err, gcal )
function doAuthedCommand ( cmd ) {
    gaccount.auth(function(err, access_token){

        if ( err )
            return cmd ( err, undefined );

        console.log ( access_token );

        gcal = new google_calendar.GoogleCalendar ( access_token );

        if ( access_token )
            return cmd ( 0, gcal );
        else
            return cmd ( "invalid access token recieved", undefined );
    });
}

// A weak test to see that things work.

function testDoAuthedCommand ()
{
    doAuthedCommand ( function ( err, gcal ) {
        var done = function ( err, result ) {
            console.log ( "done", err, result );
        };

        if ( err ) return done ( err, undefined );

        gcal.calendarList.list(function(err, calendarList) {
            if ( err ) return done ( err, undefined );

            console.log ( util.inspect ( calendarList ) );

            const id = calendarList.items[ 0 ].id;

            console.log ( "id = " + id );

            gcal.events.list(id, function(err, events) {
                if ( err ) return done ( err, undefined );

                console.log ( "events = " + util.inspect ( events, { depth: 3 } ) );

                return done ( 0, events );
            });
        });
    });
};

// An attempt to pull someone else's calendar into this user's calendar list.
// For some reason it kept getting resource not available (or something like that)
// for the account I was using it with.

function addNewCalendar ( id )
{
    doAuthedCommand ( function ( err, gcal ) {

        var opts = {
            defaultReminders: [
                { method: "popup", minutes: 15 }
            ],
            id: id,
            selected: true
        };

        console.log ( "Insert calendar opts =", opts );

        gcal.calendarList.insert ( gcal.calendarList, opts, function ( err, result ) {
            console.log ( "calendarList.insert =", err, result );
        });
    });
}

// Create and ACL for another user to see/modify this calendar.  This works, but you
// generally only need to do it once.

function shareCalendar ( id )
{
    doAuthedCommand ( function ( err, gcal ) {

        var opts = {
            role: "owner",
            scope: {
                type: "user",
                value: id
            }
        };

        console.log ( "Share calendar opts =", opts );

        gcal.acl.insert ( gcalid, opts, function ( err, result ) {
            console.log ( "acl.insert =", err, result );
        });
    });
}

// Get the user's first calendar id.  If the user has more than one
// calendar, you'll have to pick through them.  For a service account,
// there's only one calendar on initialization.
// done = function ( err, result )
function getCalId ( done )
{
    doAuthedCommand ( function ( err, gcal ) {
        if ( err ) return done ( err, undefined );

        gcal.calendarList.list(function(err, calendarList) {
        if ( err ) return done ( err, undefined );

            console.log ( util.inspect ( calendarList ) );

            const id = calendarList.items[ 0 ].id;

            console.log ( "id = " + id );

            return done ( 0, id );
        });
    });
}

////////////////////////////////////////////////////////////////////////
// Express-related functionality

var app = express();

app.get ( "/bracesout", function ( req, res ) {
    console.log ( "/bracesout called" );

    var outStart = new Date ( new Date().getTime() + config.outs.offsetStart * config.minuteMult );
    var outEnd = new Date ( new Date().getTime() + config.outs.offsetEnd * config.minuteMult );

    var outs = { summary: 'Braces Removed' , 
      start: { dateTime: outStart.toISOString() },
      end:   { dateTime: outEnd.toISOString() },
      reminders: { useDefault: false }
    };

    var inStart = new Date ( new Date().getTime() + config.ins.offsetStart * config.minuteMult );
    var inEnd = new Date ( new Date().getTime() + config.ins.offsetEnd * config.minuteMult );

    var ins = { 
        summary: 'Re-insert Braces' , 
        start: { dateTime: inStart.toISOString() },
        end:   { dateTime: inEnd.toISOString() },
        reminders: { useDefault: false,
            overrides: [{
                    method: "popup",
                    minutes: 20
                }
            ]
        }
    };

    console.log ( outs );
    console.log ( ins );

        // These two calls should be collapsed to one to minimize auth sequences with Google.
    doAuthedCommand ( function ( err, gcal ) {
        gcal.events.insert ( gcalid, outs, function ( err, result ) {
            console.log ( "Inserting outs event = ", err, result );
        });
    });

    doAuthedCommand ( function ( err, gcal ) {
        gcal.events.insert ( gcalid, ins, function ( err, result ) {
            console.log ( "Inserting ins event = ", err, util.inspect ( result, { depth: 4 } ) );
        });
    });

    return res.send ( "out" );
});


app.get ( "/bracesin", function ( req, res ) {
    console.log ( "/bracesin called" );

    var doneStart = new Date (); // ( new Date().getTime() + config.done.offsetStart * config.minuteMult );
    var doneEnd = new Date (); // ( new Date().getTime() + config.done.offsetEnd * config.minuteMult );

    var done = { 
        summary: 'Braces Re-inserted' , 
        start: { dateTime: doneStart.toISOString() },
        end:   { dateTime: doneEnd.toISOString() },
        reminders: { useDefault: false }
    };

    console.log ( done );

    doAuthedCommand ( function ( err, gcal ) {
        gcal.events.insert ( gcalid, done, function ( err, result ) {
            console.log ( "Inserting done event = ", err, result );
        });
    });

    return res.send ( "in" );
});

// run express listener
var port = process.env.PORT || 8026;
console.log ( "Listening on port", port );
app.listen ( port );

/////////////////////////////////////////////////////////////////////////

// The only thing we do on startup is get and cache the calendar id we
// are messing with.  

getCalId ( function ( err, id ) {
    if ( err ) return console.log ( "ERROR: " + err );

    gcalid = id;

    console.log ( "received calendar id = " + id );
});


// testDoAuthedCommand ();
