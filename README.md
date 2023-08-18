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
this package, that functionality is made generic so that it can be applied to
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
a `return_to` and optional `state` parameter, those will be preserved in the
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
setting `res.locals.returnTo` _and_ `res.locals.state`.  The view is expected
to decorate links with these properties and add them as hidden input to forms,
in order to propagate state to subsequent requests.

For example, if the above `/login` endpoint is requested with a `return_to`
parameter:

```http
GET /login?return_to=%2Fdashboard  HTTP/1.1
```

Then `res.locals.returnTo` will be set to `/dashboard`, making it available to
the view.

If the `/login` endpoint is requested with _both_ a `return_to` and `state`
parameter:

```http
GET /login?return_to=%2Fauthorize%2Fcontinue&state=123  HTTP/1.1
```

Then `res.locals.returnTo` will be set to `/authorize/contine` and `res.locals.state`
will be set to `123`, making them available to the view.

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



## Authors

- [Jared Hanson](https://www.jaredhanson.me/) { [![WWW](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/globe-12x12.svg)](https://www.jaredhanson.me/) [![Facebook](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/facebook-12x12.svg)](https://www.facebook.com/jaredhanson) [![LinkedIn](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/linkedin-12x12.svg)](https://www.linkedin.com/in/jaredhanson) [![Twitter](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/twitter-12x12.svg)](https://twitter.com/jaredhanson) [![GitHub](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/github-12x12.svg)](https://github.com/jaredhanson) }

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2016-2023 Jared Hanson
