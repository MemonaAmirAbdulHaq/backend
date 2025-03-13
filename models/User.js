const mongoose=require ("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      //minlength: 5,
    },
    password: {
      type: String
     // required: true,
      //minlength: 6,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    verificationCode: {
      type: String,
    },
    codeExpiration: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    verificationCodeExpires:{type:Date},


  },
  { timestamps: true } // This will automatically create `createdAt` and `updatedAt` fields
);

const User = mongoose.model("User", UserSchema);

module.exports= User;
