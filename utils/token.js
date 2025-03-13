
const jwt= require ("jsonwebtoken");
const dotenv=require( "dotenv");

dotenv.config();

const genTokenSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });

  res.cookie("jwt", token, {
    //creating cookie
    maxAge: 15 * 24 * 60 * 60 * 1000, //age of cookie in Millisec
    httpOnly: true, //configs
    sameSite: "strict",
  });
};

module.exports= genTokenSetCookie;
