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

app.get('/step-one', flowstate(), function(req, res, next) {
  // ...
});

```

The middleware will attempt to load any state intended for the endpoint, based
the `state` parameter in the query or body of the request.  If state is loaded,
it will be set at `req.state` so that the handler can process it.  If not, an
"uninitialized" state will be set at `req.state`.  A state is uninitialized when
it is new but not modified.  If the request contains a `return_to` and optional
`state` parameter, those will be preserved in the uninitialized state as the
location to redirect the user to when the current request and associated state,
if any, has been completely processed.


## Authors

- [Jared Hanson](https://www.jaredhanson.me/) { [![WWW](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/globe-12x12.svg)](https://www.jaredhanson.me/) [![Facebook](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/facebook-12x12.svg)](https://www.facebook.com/jaredhanson) [![LinkedIn](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/linkedin-12x12.svg)](https://www.linkedin.com/in/jaredhanson) [![Twitter](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/twitter-12x12.svg)](https://twitter.com/jaredhanson) [![GitHub](https://raw.githubusercontent.com/jaredhanson/jaredhanson/master/images/github-12x12.svg)](https://github.com/jaredhanson) }

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2016-2023 Jared Hanson
