# flowstate

This middleware manages and propagates per-request state across HTTP requests to
a web application.  This allows for implementing flows which are sequences of
requests and responses that, taken together, culminate in a desired outcome.

By default, this state is kept in the session.  The session itself stores state
by setting a cookie which applies to all requests to an application.  This
middleware isolates that state so it can be applied to an individual sequence of
requests.  To do this, state is propagated in `return_to` and `state` parameters
across requests.  This middleware does this automatically whenever possible,
such as when redirecting.  When not possible, such as when rendering a view,
locals and helpers are made available to the view so that `return_to` and
`state` parameters can be added to links and forms.

This middleware emerged from the state management functionality implemented by
authentication-related packages, in particular [passport-oauth2](https://www.passportjs.org/packages/passport-oauth2/) and
[oauth2orize](https://www.oauth2orize.org/) which implement OAuth 2.0.  With
this package, the functionality is made generic so that it can be applied to
any HTTP endpoint.

<div align="right">
  <sup>Developed by <a href="#authors">Jared Hanson</a>.</sub>
</div>

## Install

```bash
$ npm install flowstate
```

## Usage

#### Add Middleware

Add state middleware to your application or route:

```js
var flowstate = require('flowstate');

app.get('/login', flowstate(), function(req, res, next) {
  // ...
});

```

The middleware will attempt to load any state intended for the endpoint, based
the `state` parameter in the query or body of the request.  If state is loaded,
it will be set at `req.state` so that the handler can process it.  The value set
at `req.state` is referred to as the "current state".

If state is not loaded, an "uninitialized" state will be set at `req.state`.  A
state is uninitialized when it is new but not modified.  If the request contains
a `return_to` and optional `state` parameter, those will be captured in the
uninitialized state as the location to return the user to when the current state
has been completely processed.

When a response is sent, any modifications to the current state will be saved
if the state is not complete.  If the state is complete, any persisted state
will be removed.  Note that an uninitialized state will never be saved since it
is not modified.  However, the location to return the user to will be preserved
by propagating the `return_to` and optional `state` parameters on subsequent
requests.

#### Render a View

```js
app.get('/login', flowstate(), function(req, res, next) {
  var msgs = req.state.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !! msgs.length;
  res.render('login');
});

```

When a response is sent by rendering a view, if there is state associated with
the request, `res.locals.state` will be set to the current state's handle.
Otherwise the `return_to` and `state` parameters, if any, will be propagated by
setting `res.locals.returnTo` and `res.locals.state`.  The view is expected to
decorate links with these properties and add them as hidden input to forms, in
order to propagate state to subsequent requests.

For example, if the above `/login` endpoint is requested with a `return_to`
parameter:

```http
GET /login?return_to=%2Fdashboard  HTTP/1.1
```

Then `res.locals.returnTo` will be set to `/dashboard`, making it available to
the view.

If the `/login` endpoint is requested with both a `return_to` and `state`
parameter:

```http
GET /login?return_to=%2Fauthorize%2Fcontinue&state=xyz  HTTP/1.1
```

Then `res.locals.returnTo` will be set to `/authorize/continue` and `res.locals.state`
will be set to `xyz`, making them available to the view.

If the `/login` endpoint is requested with:

```http
GET /login?state=xyz  HTTP/1.1
```

Assuming the state was valid and intended for `/login`, `res.locals.state` will
be set to `xyz` and made available to the view.  `res.locals.returnTo` will _not_
be set.

#### Redirect to a Location

```js
app.post('/login', flowstate(), authenticate(), function(req, res, next) {
  if (mfaRequired(req.user)) {
    return res.redirect('/stepup');
  }
  // ...
}, function(err, req, res, next) {
  if (err.status !== 401) { return next(err); }
  req.state.messages = req.state.messages || [];
  req.state.messages.push('Invalid username or password.');
  req.state.failureCount = req.state.failureCount ? req.state.failureCount + 1 : 1;
  req.state.complete(false);
  res.redirect('/login');
});

```

When a response redirects the browser, if the current state is complete, any
`return_to` and `state` parameters will be propagated by decorating the target
URL.  If the current state is not complete, modifications will be saved and the
redirect will be decorated with the current state's handle.

For example, if the above `/login` endpoint is requested with a `return_to` and
`state` parameter:

```http
POST /login HTTP/1.1
Host: www.example.com
Content-Type: application/x-www-form-urlencoded

username=alice&password=letmein&return_to=%2Fauthorize%2Fcontinue&state=xyz
```

Then the user will be redirected to `/stepup?return_to=%2Fauthorize%2Fcontinue&state=xyz`,
assuming the password is valid and MFA is required.

If the password is not valid, an uninitialized state is set at `req.state` that
captures the `return_to` and `state` parameters.  It is then saved and the user
is redirected to `/login?state=Zwu8y84x` (where `'Zwu8y84x'` is the handle of
the newly saved state).  The state data stored in the session is as follows:

```json
{
  "state": {
    "Zwu8y84x": {
      "location": "https://www.example.com/login",
      "messages": [ "Invalid username or password." ],
      "failureCount": 1,
      "returnTo": "/authorize/continue",
      "state": "xyz"
    }
  }
}
```

This redirect will cause the browser to request the `GET /login` route above.
Since the request is made with a `state=Zwu8y84x` query parameter, the route will
load the state and make the handle (as well as messages) available to the view.
The view must add the handle to the login form as a hidden input field named
`state`.  When submitted, the browser will then make a request with that `state`
parameter:

```http
POST /login HTTP/1.1
Host: www.example.com
Content-Type: application/x-www-form-urlencoded

username=alice&password=letmeinnow&state=Zwu8y84x
```

This time, the `POST /login` route will load the state.  If the password is
valid and MFA is required, the user will be will be redirected to
`/stepup?return_to=%2Fauthorize%2Fcontinue&state=xyz`, as before.  This is
because the original `return_to` and `state` parameters were preserved in the
loaded state object.

If another invalid password is submitted, the cycle of redirecting, rendering
the login view, and prompting the user for a password will repeat, with the
`failureCount` incremented and saved each time.

#### Resume State

```
app.post('/login', flowstate(), authenticate(), function(req, res, next) {
  if (mfaRequired(req.user)) {
    return res.redirect('/stepup');
  }
  res.resumeState(next);
}, function(req, res, next) {
  res.redirect('/');
}, function(err, req, res, next) {
  // ...
});

```

When a user has completed a given flow, they should be returned to the location
they were navigating prior to entering the flow.  This is accomplished by
calling `resumeState()`, a function added to the response by this middleware.

If a current state was loaded, `resumeState()` will return the user to the
preserved `return_to` and `state` parameters, if any.  Otherwise, it will return
the user to the `return_to` and `state` parameters carried by the request.  If
neither of these exist, `resumeState()` will call a callback, which will
typically be `next` to invoke the next middleware.  This middleware can then
redirect the user to a default location.

For example, when `POST /login` is requested with a `state` parameter:

```http
POST /login HTTP/1.1
Host: www.example.com
Content-Type: application/x-www-form-urlencoded

username=alice&password=letmeinnow&state=Zwu8y84x
```

Then the user will be redirected to `/authorize/continue&state=xyz`,
assuming the password is valid and MFA is not required.

If the `/login` endpoint is requested with a `return_to` parameter:

```http
POST /login HTTP/1.1
Host: www.example.com
Content-Type: application/x-www-form-urlencoded

username=alice&password=letmein&return_to=%2Fdashboard
```

Then the user will be redirected to `/dashboard`, after logging in.

If the `/login` endpoint is requested without any state-related parameters:

```http
POST /login HTTP/1.1
Host: www.example.com
Content-Type: application/x-www-form-urlencoded

username=alice&password=letmein
```

Then the user will be redirected to `/` by the next middleware in the stack.

## Authors

- [Jared Hanson](https://www.jaredhanson.me/) { [![WWW](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/globe-12x12.svg)](https://www.jaredhanson.me/) [![Facebook](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/facebook-12x12.svg)](https://www.facebook.com/jaredhanson) [![LinkedIn](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/linkedin-12x12.svg)](https://www.linkedin.com/in/jaredhanson) [![Twitter](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/twitter-12x12.svg)](https://twitter.com/jaredhanson) [![GitHub](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/github-12x12.svg)](https://github.com/jaredhanson) }

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2016-2023 Jared Hanson
