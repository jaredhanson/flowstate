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
uninitialized state as the location to redirect the user to when the current
state has been completely processed.

When a success response is sent, any modifications to the current state will be
saved if the state is not complete.  If the state is complete, any persisted
state will be removed.  Note that an uninitialized state will never be saved
since it is not modified, and the location to redirect to can be preserved by
propagating the `return_to` and optional `state` parameters on subsequent
requests.

#### Render a View

```js
app.get('/login', flowstate(), function(req, res, next) {
  var msgs = req.state.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !! msgs.length;
  req.state.messages = [];
  res.render('login');
});

```

When a response is sent by rendering a view, if the current state has not been
completed, `res.locals.state` will be set to the current state's handle.  If it
has been completed, `res.local.returnTo` will be set, along with `res.locals.state`
if needed, as the location to eventually redirect the user.  The view is expected
to decorate links with these properties and add them to forms, in order to
propagate state to subsequent requests.

For example, if the above `/login` endpoint were requested with:

```http
GET /login?return_to=%2Fdashboard  HTTP/1.1
```

Then `res.locals.returnTo` would be set to `/dashboard` and made available to
the view.

If the above `/login` endpoint were requested with:

```http
GET /login?state=xyz  HTTP/1.1
```

Assuming the state was valid and intended for `/login`, `res.locals.state` would
be set to `xyz` and made available to the view.

#### Redirect to a Location

```js
app.post('/login', flowstate(), ..., function(req, res, next) {
  res.redirect('/mfa');
});

```



## Authors

- [Jared Hanson](https://www.jaredhanson.me/) { [![WWW](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/globe-12x12.svg)](https://www.jaredhanson.me/) [![Facebook](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/facebook-12x12.svg)](https://www.facebook.com/jaredhanson) [![LinkedIn](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/linkedin-12x12.svg)](https://www.linkedin.com/in/jaredhanson) [![Twitter](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/twitter-12x12.svg)](https://twitter.com/jaredhanson) [![GitHub](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/github-12x12.svg)](https://github.com/jaredhanson) }

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2016-2023 Jared Hanson
