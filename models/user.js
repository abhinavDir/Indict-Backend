import mongoose, { model, mongo } from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
     email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password:{
        type:String,
        required:true
    },
    profileImage:{
        type:String,

    },
     bio:{
        type:String,

    },
     profession:{
        type:String,

    },
     gender:{
        type:String,
        enum:["male","female"]

    },
    followers:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    following:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"

    }],
    posts:[{
         type:mongoose.Schema.Types.ObjectId,
                ref:"Post",
    }      
    ],
     saved:[{
         type:mongoose.Schema.Types.ObjectId,
                ref:"Post",
    }      
    ],
    loops:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Loop"
    }],
    story:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User" 
    },
    resetOtp:{
        type:String,
    },
    OtpExpires:{
        type:Date

    },
    isOtpVerified:{
        type:Boolean,
        default:false,
    }

}
    ,{timestamps:true})

const User = mongoose.model("User",userSchema);
export default User;