import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: {
      // login
      type: String,
      required: true,
    },
    github_id: {
      type: String,
      required: true,
    },
    avatar_url: {
      type: String,
    },
    name: {
      type: String,
    },
    location: {
      type: String,
    },
    bio: {
      type: String,
    },
    company: {
      type: String,
    },
    isHireable: {
      type: Boolean,
    },
    github_profile_url: {
      // html_url
      type: String,
    },
    user_createdAt: {
      type: String,
    },
    commit_contributions: {
      type: Array,
    },
    score: {
      type: Number,
    },
    isJOSAMember: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.plugin(mongoosePaginate);
const User = mongoose.model("User", userSchema);

export default User;
