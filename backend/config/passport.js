const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Google OAuth
const googleClientID = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackURL = `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`;

if (!googleClientID || !googleClientSecret) {
  console.warn(
    'Google OAuth disabled: missing GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET in environment variables.'
  );
} else {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientID,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          let user = await User.findOne({ email });

          if (!user) {
            user = await User.create({
              name: profile.displayName,
              email,
              password: Math.random().toString(36).slice(-8), // random password
              googleId: profile.id,
            });
          }

          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
}

// Serialize user ID to session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
