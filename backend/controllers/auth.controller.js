const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const errorHandler = require('../utils/error');
const jwt = require('jsonwebtoken');

const signup = async (req, res, next) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return next(errorHandler(400, 'All fields are required!'));
  }

  if (password !== confirmPassword) {
    return next(errorHandler(400, 'Passwords do not match!'));
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    return res.status(201).json({ message: 'User created successfully!', user: newUser });
  } catch (error) {
    return next(error);
  }
};
const signin = async (req, res, next) => {  
  const { email, password } = req.body;  
  if (!email || !password) {  
      return next(errorHandler(400, 'All fields are required!'));  
  }  
  try {  
      const validUser = await User.findOne({ email });  
      if (!validUser) {  
          return next(errorHandler(404, 'Oops! User not found'));  
      }  
      const isValidPassword = bcrypt.compareSync(password, validUser.password);  
      if (!isValidPassword) {  
          return next(errorHandler(400, 'Invalid Password!'));  
      }  
      const token = jwt.sign(  
          { id: validUser._id, isAdmin: validUser.isAdmin },  
          process.env.JWT_SECRET,  
          { expiresIn: '1h' }  
      );  
      const { password: pass, ...rest } = validUser._doc;  
      return res  
          .cookie('access_token', token, { httpOnly: true })  
          .json({ ...rest, token });  
  } catch (error) {  
      return next(error); 
  }  
};  

const google = async (req, res, next) => {  
  const { email, name, googlePhotoUrl } = req.body;  
  try {  
      let user = await User.findOne({ email });  
      if (!user) {  
          const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);  
          const hashedPassword = bcrypt.hashSync(generatedPassword, 10);  
          user = new User({  
              username: name.toLowerCase().split(' ').join('') + Math.random().toString(36).slice(-4),  
              email,  
              password: hashedPassword,  
              profilePicture: googlePhotoUrl,  
          });  
          await user.save();  
      }  
      const token = jwt.sign(  
          { id: user._id, isAdmin: user.isAdmin },  
          process.env.JWT_SECRET,  
          { expiresIn: '1h' }  
      );  
      const { password, ...rest } = user._doc;  
      return res  
          .cookie('access_token', token, { httpOnly: true })  
          .json({ token, ...rest });  
  } catch (error) {  
      return next(error); 
  }  
};

module.exports = { signup, signin, google };
